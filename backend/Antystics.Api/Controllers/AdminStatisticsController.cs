using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Core.Entities;
using Antystics.Infrastructure.Data;
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

    public AdminStatisticsController(
        ApplicationDbContext context,
        IMemoryCache cache,
        ILogger<AdminStatisticsController> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AdminStatisticsSummaryResponse>> GetSummary(CancellationToken cancellationToken)
    {
        try
        {
            var summary = await _cache.GetOrCreateAsync(CacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = CacheDuration;

                var stats = await _context.GaStatistics
                    .AsNoTracking()
                    .OrderBy(s => s.Date)
                    .ToListAsync(cancellationToken);

                return AdminStatisticsSummaryResponse.Create(stats, DateTime.UtcNow);
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

        public static AdminStatisticsSummaryResponse Create(IReadOnlyCollection<GaStatistic> stats, DateTime utcNow)
        {
            if (stats.Count == 0)
            {
                return Empty;
            }

            var today = DateOnly.FromDateTime(utcNow.Date);
            var dateIndexed = stats
                .Select(s => new DailyStatistic(DateOnly.FromDateTime(s.Date.Date), s))
                .ToList();

            return new AdminStatisticsSummaryResponse
            {
                Today = Compute(dateIndexed.Where(s => s.Date == today).Select(s => s.Source)),
                Last7Days = Compute(dateIndexed.Where(s => s.Date >= today.AddDays(-6)).Select(s => s.Source)),
                Last30Days = Compute(dateIndexed.Where(s => s.Date >= today.AddDays(-29)).Select(s => s.Source)),
                Last365Days = Compute(dateIndexed.Where(s => s.Date >= today.AddDays(-364)).Select(s => s.Source)),
                Overall = Compute(dateIndexed.Select(s => s.Source))
            };
        }

        private static SummaryBlock Compute(IEnumerable<GaStatistic> stats)
        {
            var list = stats as IList<GaStatistic> ?? stats.ToList();
            if (list.Count == 0)
            {
                return SummaryBlock.Empty;
            }

            return new SummaryBlock
            {
                TotalPageViews = list.Sum(s => s.TotalPageViews),
                UniqueVisitors = list.Sum(s => s.UniqueVisitors),
                HumanPageViews = list.Sum(s => s.HumanPageViews)
            };
        }

        private readonly record struct DailyStatistic(DateOnly Date, GaStatistic Source);
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
