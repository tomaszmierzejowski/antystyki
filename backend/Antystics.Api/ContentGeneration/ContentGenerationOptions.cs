namespace Antystics.Api.ContentGeneration;

public sealed class ContentGenerationOptions
{
    public bool Enabled { get; set; } = true;
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
    /// <summary>
    /// Hard wall-clock budget for a single GenerateAsync attempt (source fetch + validation + LLM).
    /// Replaces the previous heuristic of HttpTimeoutSeconds * 12.
    /// Default (360 s) is generous enough for ~17 sources × up to 20 s each plus LLM calls.
    /// </summary>
    public int RunTimeoutSeconds { get; set; } = 360;
    public int SourceHealthMaxAttempts { get; set; } = 3;
    public int SourceFetchMaxAttempts { get; set; } = 3;
    public int SourceUrlCheckMaxAttempts { get; set; } = 2;
    public int RetryBaseDelaySeconds { get; set; } = 2;
    public int RunMaxAttempts { get; set; } = 2;
    public List<string> EnabledSourceIds { get; set; } = new();
    public List<string> TrustedSourceIds { get; set; } = new();
    public bool EnforceTrustedSources { get; set; } = true;
    public int MinimumSourceReliability { get; set; } = 4;
    public bool RequireSourceUrlHttp200 { get; set; } = true;
    public double MinimumValidationConfidence { get; set; } = 0.6;
    public bool RunAtStartup { get; set; } = true;
    public int StartupDelaySeconds { get; set; } = 30;
    public string? OpenAiApiKey { get; set; }
    public string OpenAiModel { get; set; } = "gpt-4o";

    // Gemini (preferred)
    public string? GeminiApiKey { get; set; }
    public string GeminiModel { get; set; } = "gemini-2.5-flash";
}
