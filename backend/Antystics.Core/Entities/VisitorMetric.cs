using System;

namespace Antystics.Core.Entities;

public class VisitorMetric
{
    public DateOnly Date { get; set; }

    public long TotalPageViews { get; set; }

    public long UniqueVisitors { get; set; }

    public long TotalBotRequests { get; set; }

    public long UniqueBots { get; set; }

    public DateTime LastUpdatedAtUtc { get; set; }
}

