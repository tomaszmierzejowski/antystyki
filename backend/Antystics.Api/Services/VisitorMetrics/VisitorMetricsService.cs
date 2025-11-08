using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Antystics.Api.Services.VisitorMetrics;

internal sealed class VisitorMetricsService : IVisitorMetricsService
{
    private readonly VisitorMetricsOptions _options;
    private readonly ILogger<VisitorMetricsService> _logger;
    private readonly ConcurrentDictionary<DateOnly, VisitorDailyMetrics> _dailyMetrics = new();
    private readonly ConcurrentDictionary<DateOnly, VisitorDailySummary> _persistedSummaries = new();
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);
    private byte[] _hashSecretBytes = Array.Empty<byte>();

    public VisitorMetricsService(IOptions<VisitorMetricsOptions> options, ILogger<VisitorMetricsService> logger)
    {
        _options = options.Value;
        _logger = logger;
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
            Directory.CreateDirectory(_options.StorageDirectory);

            foreach (var (date, metrics) in _dailyMetrics.ToArray())
            {
                var summary = metrics.AsSummary();
                var filePath = GetFilePath(date);

                await using var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
                await JsonSerializer.SerializeAsync(stream, summary, _jsonOptions, cancellationToken).ConfigureAwait(false);

                _persistedSummaries[date] = summary;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist visitor metrics");
        }
    }

    public void RemoveExpiredData(DateOnly minimumDateToKeep)
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
                TryDeleteFile(key);
            }
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
            if (!Directory.Exists(_options.StorageDirectory))
            {
                return;
            }

            foreach (var file in Directory.EnumerateFiles(_options.StorageDirectory, "*.json"))
            {
                try
                {
                    using var stream = File.OpenRead(file);
                    var summary = JsonSerializer.Deserialize<VisitorDailySummary>(stream, _jsonOptions);
                    if (summary is null)
                    {
                        continue;
                    }

                    _persistedSummaries[summary.Date] = summary;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to load visitor metrics file {File}", file);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to enumerate persisted visitor metrics");
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

    private string GetFilePath(DateOnly date) => Path.Combine(_options.StorageDirectory, $"{date:yyyy-MM-dd}.json");

    private void TryDeleteFile(DateOnly date)
    {
        var path = GetFilePath(date);
        if (!File.Exists(path))
        {
            return;
        }

        try
        {
            File.Delete(path);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete expired visitor metrics file {File}", path);
        }
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
