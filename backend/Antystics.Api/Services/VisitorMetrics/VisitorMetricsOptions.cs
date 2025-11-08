using System;
using System.IO;

namespace Antystics.Api.Services.VisitorMetrics;

public class VisitorMetricsOptions
{
    /// <summary>
    /// Secret used to HMAC visitor identifiers. Must be configured via environment variable VISITOR_METRICS_HASH_SECRET.
    /// </summary>
    public string HashSecret { get; set; } = string.Empty;

    /// <summary>
    /// Directory where aggregated daily metrics will be persisted as JSON (relative to app root by default).
    /// </summary>
    public string StorageDirectory { get; set; } = Path.Combine(AppContext.BaseDirectory, "logs", "visitor-metrics");

    /// <summary>
    /// Number of days to retain aggregated metrics in memory and on disk.
    /// </summary>
    public int RetentionDays { get; set; } = 60;

    /// <summary>
    /// Interval in minutes between automatic persistence flushes.
    /// </summary>
    public int FlushIntervalMinutes { get; set; } = 5;

    /// <summary>
    /// If true, requests identified as bots will be stored separately from human traffic.
    /// </summary>
    public bool TrackBots { get; set; } = true;
}
