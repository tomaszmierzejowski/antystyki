using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Core.Entities;
using Antystics.Infrastructure.Data;
using Antystics.Api.Services.VisitorMetrics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/admin/statistics")]
[Authorize(Policy = "AdminOnly")]
public class AdminStatisticsController : ControllerBase
{
    private static readonly string CacheKey = "admin_statistics_summary";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(15);

    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AdminStatisticsController> _logger;
    private readonly IVisitorMetricsService _visitorMetricsService;

    public AdminStatisticsController(
        ApplicationDbContext context,
        IMemoryCache cache,
        ILogger<AdminStatisticsController> logger,
        IVisitorMetricsService visitorMetricsService)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
        _visitorMetricsService = visitorMetricsService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AdminStatisticsSummaryResponse>> GetSummary(CancellationToken cancellationToken)
    {
        try
        {
            var summary = await _cache.GetOrCreateAsync(CacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = CacheDuration;

                var requestUtcNow = DateTime.UtcNow;
                var today = DateOnly.FromDateTime(requestUtcNow.Date);
                var visitorFromDate = today.AddDays(-364);
                var visitorSummaries = _visitorMetricsService.GetDailySummaries(visitorFromDate, today);
                var stats = await _context.GaStatistics
                    .AsNoTracking()
                    .OrderBy(s => s.Date)
                    .ToListAsync(cancellationToken);

                return AdminStatisticsSummaryResponse.Create(stats, visitorSummaries, requestUtcNow);
            }).ConfigureAwait(false);

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve admin statistics summary");
            return StatusCode(500, new { message = "Failed to load statistics summary." });
        }
    }

    public sealed class AdminStatisticsSummaryResponse
    {
        public SummaryBlock Today { get; init; } = SummaryBlock.Empty;
        public SummaryBlock Last7Days { get; init; } = SummaryBlock.Empty;
        public SummaryBlock Last30Days { get; init; } = SummaryBlock.Empty;
        public SummaryBlock Last365Days { get; init; } = SummaryBlock.Empty;
        public SummaryBlock Overall { get; init; } = SummaryBlock.Empty;

        public static AdminStatisticsSummaryResponse Empty => new();

        public static AdminStatisticsSummaryResponse Create(
            IReadOnlyCollection<GaStatistic> gaStatistics,
            IReadOnlyCollection<VisitorDailySummary> visitorSummaries,
            DateTime utcNow)
        {
            if (gaStatistics.Count == 0 && visitorSummaries.Count == 0)
            {
                return Empty;
            }

            var today = DateOnly.FromDateTime(utcNow.Date);
            var aggregatedByDate = new Dictionary<DateOnly, DailyAggregate>();

            foreach (var summary in gaStatistics)
            {
                var date = DateOnly.FromDateTime(summary.Date.Date);
                aggregatedByDate[date] = new DailyAggregate(
                    date,
                    summary.TotalPageViews,
                    summary.UniqueVisitors,
                    summary.HumanPageViews);
            }

            foreach (var visitorSummary in visitorSummaries)
            {
                aggregatedByDate[visitorSummary.Date] = new DailyAggregate(
                    visitorSummary.Date,
                    visitorSummary.TotalPageViews,
                    visitorSummary.UniqueVisitors,
                    visitorSummary.HumanPageViews);
            }

            var dailySeries = aggregatedByDate.Values.ToList();

            return new AdminStatisticsSummaryResponse
            {
                Today = Compute(dailySeries.Where(s => s.Date == today)),
                Last7Days = Compute(dailySeries.Where(s => s.Date >= today.AddDays(-6))),
                Last30Days = Compute(dailySeries.Where(s => s.Date >= today.AddDays(-29))),
                Last365Days = Compute(dailySeries.Where(s => s.Date >= today.AddDays(-364))),
                Overall = Compute(dailySeries)
            };
        }

        private static SummaryBlock Compute(IEnumerable<DailyAggregate> stats)
        {
            var list = stats as IList<DailyAggregate> ?? stats.ToList();
            if (list.Count == 0)
            {
                return SummaryBlock.Empty;
            }

            return new SummaryBlock
            {
                TotalPageViews = list.Sum(s => s.TotalPageViews),
                UniqueVisitors = list.Sum(s => s.UniqueVisitors),
                HumanPageViews = list.Sum(s => s.HumanPageViews),
            };
        }

        private sealed record DailyAggregate(DateOnly Date, long TotalPageViews, long UniqueVisitors, long HumanPageViews);
    }

    public sealed class SummaryBlock
    {
        public long TotalPageViews { get; init; }
        public long UniqueVisitors { get; init; }
        public long HumanPageViews { get; init; }

        public static SummaryBlock Empty => new SummaryBlock
        {
            TotalPageViews = 0,
            UniqueVisitors = 0,
            HumanPageViews = 0
        };
    }
}
