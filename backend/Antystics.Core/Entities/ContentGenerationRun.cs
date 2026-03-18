namespace Antystics.Core.Entities;

public class ContentGenerationRun
{
    public Guid Id { get; set; }
    public string Trigger { get; set; } = string.Empty; // scheduled | manual
    public bool DryRun { get; set; }
    public string Status { get; set; } = ContentGenerationRunStatuses.Queued;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? RequestedBy { get; set; }
    public int RequestedStatistics { get; set; }
    public int RequestedAntystics { get; set; }
    public int AttemptCount { get; set; }
    public int CreatedStatisticsCount { get; set; }
    public int CreatedAntysticsCount { get; set; }
    public int DuplicateCount { get; set; }
    public int SourceFailureCount { get; set; }
    public int ValidationFailureCount { get; set; }
    public string? ValidationIssuesJson { get; set; }
    public string? ErrorMessage { get; set; }
    public string? SourceIdsCsv { get; set; }
}

public static class ContentGenerationRunStatuses
{
    public const string Queued = "queued";
    public const string Running = "running";
    public const string Succeeded = "succeeded";
    public const string Failed = "failed";
}
