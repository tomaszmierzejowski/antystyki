using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Core.Entities;
using Antystics.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;

namespace Antystics.Api.Services.VisitorMetrics;

internal sealed class VisitorMetricsService : IVisitorMetricsService
{
    private readonly VisitorMetricsOptions _options;
    private readonly ILogger<VisitorMetricsService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ConcurrentDictionary<DateOnly, VisitorDailyMetrics> _dailyMetrics = new();
    private readonly ConcurrentDictionary<DateOnly, VisitorDailySummary> _persistedSummaries = new();
    private byte[] _hashSecretBytes = Array.Empty<byte>();

    public VisitorMetricsService(
        IOptions<VisitorMetricsOptions> options,
        ILogger<VisitorMetricsService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _options = options.Value;
        _logger = logger;
        _scopeFactory = scopeFactory;
        InitializeHashSecret();
        LoadPersistedSummaries();
    }

    public void RegisterVisit(DateTime timestampUtc, string ipAddress, string? userAgent, string path, bool isBot)
    {
        _ = path;
        if (string.IsNullOrWhiteSpace(ipAddress))
        {
            return;
        }

        var date = DateOnly.FromDateTime(timestampUtc);
        var metrics = _dailyMetrics.GetOrAdd(date, static d => new VisitorDailyMetrics(d));
        var hashedKey = CreateVisitorKey(date, ipAddress, userAgent);

        metrics.RegisterVisit(hashedKey, isBot);
    }

    public IReadOnlyList<VisitorDailySummary> GetDailySummaries(DateOnly fromDate, DateOnly toDate)
    {
        if (fromDate > toDate)
        {
            (fromDate, toDate) = (toDate, fromDate);
        }

        var results = new List<VisitorDailySummary>();
        for (var date = fromDate; date <= toDate; date = date.AddDays(1))
        {
            if (_dailyMetrics.TryGetValue(date, out var metrics))
            {
                results.Add(metrics.AsSummary());
                continue;
            }

            if (_persistedSummaries.TryGetValue(date, out var summary))
            {
                results.Add(summary);
            }
        }

        return results;
    }

    public async Task PersistAsync(CancellationToken cancellationToken)
    {
        try
        {
            var snapshots = _dailyMetrics.ToArray();
            if (snapshots.Length == 0)
            {
                return;
            }

            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var targetDates = snapshots.Select(x => x.Key).ToArray();
            var existing = await dbContext.VisitorMetrics
                .Where(metric => targetDates.Contains(metric.Date))
                .ToDictionaryAsync(metric => metric.Date, cancellationToken)
                .ConfigureAwait(false);

            foreach (var (date, metrics) in snapshots)
            {
                var summary = metrics.AsSummary();

                if (existing.TryGetValue(date, out var entity))
                {
                    entity.TotalPageViews = summary.TotalPageViews;
                    entity.UniqueVisitors = summary.UniqueVisitors;
                    entity.TotalBotRequests = summary.TotalBotRequests;
                    entity.UniqueBots = summary.UniqueBots;
                    entity.LastUpdatedAtUtc = DateTime.UtcNow;
                }
                else
                {
                    dbContext.VisitorMetrics.Add(new VisitorMetric
                    {
                        Date = summary.Date,
                        TotalPageViews = summary.TotalPageViews,
                        UniqueVisitors = summary.UniqueVisitors,
                        TotalBotRequests = summary.TotalBotRequests,
                        UniqueBots = summary.UniqueBots,
                        LastUpdatedAtUtc = DateTime.UtcNow
                    });
                }

                _persistedSummaries[date] = summary;
            }

            await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist visitor metrics");
        }
    }

    public async Task RemoveExpiredDataAsync(DateOnly minimumDateToKeep, CancellationToken cancellationToken)
    {
        foreach (var key in _dailyMetrics.Keys)
        {
            if (key < minimumDateToKeep)
            {
                _dailyMetrics.TryRemove(key, out _);
            }
        }

        foreach (var key in _persistedSummaries.Keys)
        {
            if (key < minimumDateToKeep)
            {
                _persistedSummaries.TryRemove(key, out _);
            }
        }

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var expired = await dbContext.VisitorMetrics
                .Where(metric => metric.Date < minimumDateToKeep)
                .ToListAsync(cancellationToken)
                .ConfigureAwait(false);

            if (expired.Count > 0)
            {
                dbContext.VisitorMetrics.RemoveRange(expired);
                await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to remove expired visitor metrics from database");
        }
    }

    private void InitializeHashSecret()
    {
        if (string.IsNullOrWhiteSpace(_options.HashSecret))
        {
            _logger.LogWarning("VISITOR_METRICS_HASH_SECRET is not configured. Unique visitor counts may be inconsistent after restarts.");
            _hashSecretBytes = RandomNumberGenerator.GetBytes(32);
            return;
        }

        _hashSecretBytes = Encoding.UTF8.GetBytes(_options.HashSecret);
    }

    private void LoadPersistedSummaries()
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var oldestDateToLoad = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-_options.RetentionDays));
            var storedSummaries = dbContext.VisitorMetrics
                .Where(metric => metric.Date >= oldestDateToLoad)
                .AsNoTracking()
                .ToList();

            foreach (var metric in storedSummaries)
            {
                var summary = new VisitorDailySummary(
                    metric.Date,
                    metric.TotalPageViews,
                    metric.UniqueVisitors,
                    metric.TotalBotRequests,
                    metric.UniqueBots);
                _persistedSummaries[metric.Date] = summary;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load persisted visitor metrics");
        }
    }

    private string CreateVisitorKey(DateOnly date, string ipAddress, string? userAgent)
    {
        var normalizedUa = string.IsNullOrWhiteSpace(userAgent) ? "unknown" : userAgent.Trim();
        var payload = string.Create(CultureInfo.InvariantCulture, $"{date:yyyy-MM-dd}|{ipAddress}|{normalizedUa}");

        using var hmac = new HMACSHA256(_hashSecretBytes);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash);
    }

    private sealed class VisitorDailyMetrics
    {
        private readonly DateOnly _date;
        private long _totalRequests;
        private long _botRequests;
        private readonly ConcurrentDictionary<string, byte> _uniqueVisitors = new();
        private readonly ConcurrentDictionary<string, byte> _uniqueBots = new();

        public VisitorDailyMetrics(DateOnly date)
        {
            _date = date;
        }

        public void RegisterVisit(string hashedKey, bool isBot)
        {
            Interlocked.Increment(ref _totalRequests);

            if (isBot)
            {
                Interlocked.Increment(ref _botRequests);
                _uniqueBots.TryAdd(hashedKey, 0);
                return;
            }

            _uniqueVisitors.TryAdd(hashedKey, 0);
        }

        public VisitorDailySummary AsSummary()
        {
            var uniqueVisitors = _uniqueVisitors.Count;
            var uniqueBots = _uniqueBots.Count;
            var totalBots = Interlocked.Read(ref _botRequests);
            var totalRequests = Interlocked.Read(ref _totalRequests);
            return new VisitorDailySummary(_date, totalRequests, uniqueVisitors, totalBots, uniqueBots);
        }
    }
}
