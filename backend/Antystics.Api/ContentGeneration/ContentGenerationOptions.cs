using System.Collections.Generic;

namespace Antystics.Api.ContentGeneration;

public sealed class ContentGenerationOptions
{
    public string DailyRunLocalTime { get; set; } = "07:00";
    public int MinStatistics { get; set; } = 5;
    public int MaxStatistics { get; set; } = 6;
    public int MinAntystics { get; set; } = 1;
    public int MaxAntystics { get; set; } = 5;
    public string CreatorEmail { get; set; } = "antystyki@gmail.com";
    public string SourcesPath { get; set; } = "ContentGeneration/content-sources.json";
    public int DuplicateWindowDays { get; set; } = 30;
    public double PolandRatioFloor { get; set; } = 0.5;
    public int HttpTimeoutSeconds { get; set; } = 12;
    public List<string> EnabledSourceIds { get; set; } = new();
    public bool RunAtStartup { get; set; } = true;
    public int StartupDelaySeconds { get; set; } = 30;
}
