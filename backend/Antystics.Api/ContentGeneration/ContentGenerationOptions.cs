using System;
using System.Collections.Generic;

namespace Antystics.Api.ContentGeneration;

public sealed class ContentGenerationOptions
{
    /// <summary>
    /// Local time (HH:mm) when the daily job should run. Default is 07:00.
    /// </summary>
    public string DailyRunLocalTime { get; set; } = "07:00";

    /// <summary>
    /// Minimum number of statistics to produce per run.
    /// </summary>
    public int MinStatistics { get; set; } = 5;

    /// <summary>
    /// Soft ceiling for statistics per run.
    /// </summary>
    public int MaxStatistics { get; set; } = 6;

    /// <summary>
    /// Minimum number of antystics to produce per run.
    /// </summary>
    public int MinAntystics { get; set; } = 1;

    /// <summary>
    /// Soft ceiling for antystics per run.
    /// </summary>
    public int MaxAntystics { get; set; } = 5;

    /// <summary>
    /// System user email used as creator for auto-generated drafts.
    /// </summary>
    public string CreatorEmail { get; set; } = "antystyki@gmail.com";

    /// <summary>
    /// Path (relative to content root) to the JSON source manifest.
    /// </summary>
    public string SourcesPath { get; set; } = "ContentGeneration/content-sources.json";

    /// <summary>
    /// Duplicate suppression window in days.
    /// </summary>
    public int DuplicateWindowDays { get; set; } = 30;

    /// <summary>
    /// Require at least this ratio of Poland-focused sources (0-1).
    /// </summary>
    public double PolandRatioFloor { get; set; } = 0.5;

    /// <summary>
    /// Timeout for HTTP calls to sources (seconds).
    /// </summary>
    public int HttpTimeoutSeconds { get; set; } = 12;

    /// <summary>
    /// Optional allowlist of source IDs to enable; empty = all.
    /// </summary>
    public List<string> EnabledSourceIds { get; set; } = new();
}
