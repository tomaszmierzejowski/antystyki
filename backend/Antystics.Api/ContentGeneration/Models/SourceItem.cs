using System;
using System.Collections.Generic;

namespace Antystics.Api.ContentGeneration.Models;

public sealed record SourceItem
{
    public string SourceId { get; init; } = string.Empty;
    public string SourceName { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
    public string SourceUrl { get; init; } = string.Empty;
    public DateTimeOffset? PublishedAt { get; init; }
    public IReadOnlyCollection<string> Topics { get; init; } = Array.Empty<string>();
    public IReadOnlyCollection<string> Tags { get; init; } = Array.Empty<string>();
    public bool PolandFocus { get; init; }
    public bool HumorFriendly { get; init; }
    public string GeoFocus { get; init; } = string.Empty;
    public string? Publisher { get; init; }
    public double? PercentageValue { get; init; }
    public string? Ratio { get; init; }
    public string? Timeframe { get; init; }
    public string? ContextSentence { get; init; }
    public string? NumericStatement { get; init; }
    public string? ReversedStatistic { get; init; }
    public int? SourceStatusCode { get; init; }
    public DateTimeOffset FetchedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public bool SourceUrlVerified { get; init; }
    public bool IsTrustedSource { get; init; }
    public double? ValidationConfidence { get; init; }
    public string? GenerationKey { get; init; }
    /// <summary>Chart type hint from LLM: "pie" | "bar" | "trend" | "comparison"</summary>
    public string? ChartType { get; init; }
    /// <summary>Short Polish label (≤50 chars) for the main chart value, e.g. "Polacy bez oszczędności"</summary>
    public string? ChartLabelMain { get; init; }
    /// <summary>Short Polish label (≤50 chars) for the secondary/contrast chart value, e.g. "Pozostałe"</summary>
    public string? ChartLabelSecondary { get; init; }
}

public sealed record GeneratedDraft
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
    public string SourceUrl { get; init; } = string.Empty;
    public string SourceCitation { get; init; } = string.Empty;
    public string Kind { get; init; } = string.Empty;
    /// <summary>Raw ChartData JSON that was (or would be) persisted — useful for dry-run inspection.</summary>
    public string? ChartData { get; init; }
    public string? TemplateId { get; init; }
}

public sealed record ContentGenerationRequest
{
    public bool DryRun { get; init; }
    public bool AllowDuplicates { get; init; }
    public int? TargetStatistics { get; init; }
    public int? TargetAntystics { get; init; }
    public IReadOnlyCollection<string>? SourceIds { get; init; }
    public DateTimeOffset? ExecutionTime { get; init; }
}

public sealed record ContentGenerationResult
{
    public IReadOnlyCollection<GeneratedDraft> CreatedStatistics { get; init; } = Array.Empty<GeneratedDraft>();
    public IReadOnlyCollection<GeneratedDraft> CreatedAntystics { get; init; } = Array.Empty<GeneratedDraft>();
    public IReadOnlyCollection<string> SkippedDuplicates { get; init; } = Array.Empty<string>();
    public IReadOnlyCollection<string> SourceFailures { get; init; } = Array.Empty<string>();
    public IReadOnlyCollection<string> ValidationFailures { get; init; } = Array.Empty<string>();
    public IReadOnlyCollection<ValidationIssue> ValidationIssues { get; init; } = Array.Empty<ValidationIssue>();
    public DateTimeOffset ExecutedAt { get; init; }
    public bool DryRun { get; init; }
    public string Outcome { get; init; } = "unknown";
    /// <summary>
    /// JSON array of per-source outcome metrics for this run.
    /// Stored in <see cref="Antystics.Core.Entities.ContentGenerationRun.SourcePerformanceJson"/>
    /// and used for rolling quarantine calculations.
    /// </summary>
    public string? SourcePerformanceJson { get; init; }
    /// <summary>
    /// JSON array of sources that were skipped (quarantine / low-yield gate).
    /// Stored in <see cref="Antystics.Core.Entities.ContentGenerationRun.SkippedSourcesJson"/>.
    /// </summary>
    public string? SkippedSourcesJson { get; init; }
}

public sealed record ValidationIssue
{
    public string SourceId { get; init; } = string.Empty;
    public string SourceName { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string? SourceUrl { get; init; }
    public int? SourceStatusCode { get; init; }
    public double? PercentageValue { get; init; }
    public string? Ratio { get; init; }
    public string? Timeframe { get; init; }
    public string? ContextSentence { get; init; }
    public double? ValidationConfidence { get; init; }
    public bool? TrustedSource { get; init; }
}
