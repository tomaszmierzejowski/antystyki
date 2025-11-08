using System;

namespace Antystics.Api.Services.VisitorMetrics;

public record VisitorDailySummary(
    DateOnly Date,
    long TotalPageViews,
    long UniqueVisitors,
    long TotalBotRequests,
    long UniqueBots)
{
    public long HumanPageViews => TotalPageViews - TotalBotRequests;
}
