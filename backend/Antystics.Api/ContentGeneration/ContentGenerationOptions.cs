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

    // ── Source yield gating ──────────────────────────────────────────────
    /// <summary>
    /// When true, Low-yield sources are only fetched if High+Medium sources have not
    /// yet produced enough pre-screen candidates to meet <see cref="MinStatistics"/>.
    /// Prevents low-density sources from crowding out high-density ones in
    /// the candidate pool.
    /// </summary>
    public bool LowYieldGatingEnabled { get; set; } = true;

    /// <summary>
    /// Minimum number of pre-screen–passing candidates from High+Medium sources
    /// before Low-yield sources are skipped entirely.
    /// Default: MinStatistics × 3 (heuristic — enough headroom for LLM rejection).
    /// Set to 0 to disable gating.
    /// </summary>
    public int LowYieldSkipThreshold { get; set; } = 0; // 0 = auto (3 × MinStatistics)

    // ── Source quarantine ────────────────────────────────────────────────
    /// <summary>
    /// When true, sources whose rolling pre-screen acceptance rate is below
    /// <see cref="SourceQuarantineMinPrescreenRate"/> across the last
    /// <see cref="SourceQuarantineWindowRuns"/> completed runs are automatically
    /// skipped. Disabled by default — requires data from several runs to be reliable.
    /// </summary>
    public bool SourceQuarantineEnabled { get; set; } = false;

    /// <summary>Number of recent completed runs to evaluate per-source acceptance.</summary>
    public int SourceQuarantineWindowRuns { get; set; } = 5;

    /// <summary>
    /// Minimum total items a source must have fetched across the evaluation window
    /// before its acceptance rate is considered reliable enough to quarantine.
    /// </summary>
    public int SourceQuarantineMinFetched { get; set; } = 5;

    /// <summary>
    /// If a source's (prescreenPassed / fetched) rate over the evaluation window is below
    /// this threshold it is quarantined for the run. Default 5 %.
    /// </summary>
    public double SourceQuarantineMinPrescreenRate { get; set; } = 0.05;
}
