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
    public int? SourceStatusCode { get; init; }
}

public sealed record GeneratedDraft
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
    public string SourceUrl { get; init; } = string.Empty;
    public string SourceCitation { get; init; } = string.Empty;
    public string Kind { get; init; } = string.Empty;
}

public sealed record ContentGenerationRequest
{
    public bool DryRun { get; init; }
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
}
