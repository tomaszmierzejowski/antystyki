using System;
using System.Collections.Generic;
using System.Linq;
using Antystics.Api.Services.VisitorMetrics;
using Antystics.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/metrics/visitors")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class VisitorMetricsController : ControllerBase
{
    private readonly IVisitorMetricsService _metricsService;

    public VisitorMetricsController(IVisitorMetricsService metricsService)
    {
        _metricsService = metricsService;
    }

    [HttpGet("daily")]
    public ActionResult<IEnumerable<DailyVisitorMetricsDto>> GetDaily([FromQuery] int days = 30)
    {
        if (days <= 0)
        {
            days = 30;
        }

        var toDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var fromDate = toDate.AddDays(-days + 1);
        var summaries = _metricsService.GetDailySummaries(fromDate, toDate)
            .OrderBy(summary => summary.Date)
            .Select(summary => new DailyVisitorMetricsDto
            {
                Date = summary.Date,
                TotalPageViews = summary.TotalPageViews,
                UniqueVisitors = summary.UniqueVisitors,
                UniqueBots = summary.UniqueBots,
                BotPageViews = summary.TotalBotRequests,
                HumanPageViews = summary.HumanPageViews
            });

        return Ok(summaries);
    }

    public sealed class DailyVisitorMetricsDto
    {
        public DateOnly Date { get; init; }
        public long TotalPageViews { get; init; }
        public long HumanPageViews { get; init; }
        public long UniqueVisitors { get; init; }
        public long BotPageViews { get; init; }
        public long UniqueBots { get; init; }
    }
}
