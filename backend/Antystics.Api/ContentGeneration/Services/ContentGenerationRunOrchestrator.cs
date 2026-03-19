using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Models;
using Antystics.Core.Entities;
using Antystics.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Antystics.Api.ContentGeneration.Services;

public interface IContentGenerationRunOrchestrator
{
    Task<ContentGenerationRunStartResult> QueueRunAsync(
        ContentGenerationRequest request,
        string trigger,
        string? requestedBy,
        CancellationToken cancellationToken);

    Task<ContentGenerationRunView?> GetRunAsync(Guid runId, CancellationToken cancellationToken);

    /// <summary>
    /// Marks a specific run as Failed. Used by the admin force-cancel endpoint to
    /// unblock production when a run is orphaned or stuck.
    /// </summary>
    Task<bool> CancelRunAsync(Guid runId, string reason, CancellationToken cancellationToken);

    /// <summary>
    /// Marks all Queued/Running runs as Failed. Called once on startup to recover
    /// runs orphaned by a previous process crash or deployment rollout.
    /// </summary>
    Task RecoverOrphanedRunsAsync(CancellationToken cancellationToken);
}

internal sealed class ContentGenerationRunOrchestrator : IContentGenerationRunOrchestrator
{
    private static readonly SemaphoreSlim RunGate = new(1, 1);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ContentGenerationOptions _options;
    private readonly ILogger<ContentGenerationRunOrchestrator> _logger;

    public ContentGenerationRunOrchestrator(
        IServiceScopeFactory scopeFactory,
        IOptions<ContentGenerationOptions> options,
        ILogger<ContentGenerationRunOrchestrator> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<ContentGenerationRunStartResult> QueueRunAsync(
        ContentGenerationRequest request,
        string trigger,
        string? requestedBy,
        CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var active = await db.ContentGenerationRuns
            .Where(r => r.Status == ContentGenerationRunStatuses.Queued || r.Status == ContentGenerationRunStatuses.Running)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        if (active != null)
        {
            // A run is considered stale if it has been in a non-terminal state for
            // longer than RunTimeoutSeconds × (RunMaxAttempts + 1). This handles the
            // case where the process was killed before the run could write a terminal
            // status (orphaned run). Default: 360 × 3 = 1080 s ≈ 18 minutes.
            var staleThreshold = TimeSpan.FromSeconds(
                _options.RunTimeoutSeconds * (Math.Max(1, _options.RunMaxAttempts) + 1));
            var staleSince = active.StartedAt ?? active.CreatedAt;
            if (DateTime.UtcNow - staleSince > staleThreshold)
            {
                _logger.LogWarning(
                    "Found stale run {RunId} (status={Status}, age={AgeMinutes:F1} min). " +
                    "Auto-expiring and proceeding with new run.",
                    active.Id, active.Status, (DateTime.UtcNow - staleSince).TotalMinutes);

                active.Status = ContentGenerationRunStatuses.Failed;
                active.ErrorMessage = $"Orphaned: run exceeded stale threshold " +
                    $"({staleThreshold.TotalSeconds:F0} s). Process may have restarted mid-run.";
                active.CompletedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }
            else
            {
                return new ContentGenerationRunStartResult
                {
                    Accepted = false,
                    Message = "Another content generation run is already in progress.",
                    ActiveRunId = active.Id
                };
            }
        }

        var run = new ContentGenerationRun
        {
            Id = Guid.NewGuid(),
            Trigger = trigger,
            DryRun = request.DryRun,
            Status = ContentGenerationRunStatuses.Queued,
            CreatedAt = DateTime.UtcNow,
            RequestedBy = requestedBy,
            RequestedStatistics = request.TargetStatistics ?? _options.MaxStatistics,
            RequestedAntystics = request.TargetAntystics ?? _options.MaxAntystics,
            SourceIdsCsv = request.SourceIds != null ? string.Join(",", request.SourceIds) : null
        };

        db.ContentGenerationRuns.Add(run);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _ = Task.Run(() => ExecuteRunAsync(run.Id, request), CancellationToken.None);

        return new ContentGenerationRunStartResult
        {
            Accepted = true,
            RunId = run.Id,
            Message = "Content generation has been queued."
        };
    }

    public async Task<ContentGenerationRunView?> GetRunAsync(Guid runId, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var run = await db.ContentGenerationRuns.FirstOrDefaultAsync(r => r.Id == runId, cancellationToken).ConfigureAwait(false);
        return run == null ? null : Map(run);
    }

    private async Task ExecuteRunAsync(Guid runId, ContentGenerationRequest request)
    {
        await RunGate.WaitAsync(CancellationToken.None).ConfigureAwait(false);
        try
        {
            for (var attempt = 1; attempt <= Math.Max(1, _options.RunMaxAttempts); attempt++)
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var generationService = scope.ServiceProvider.GetRequiredService<IContentGenerationService>();
                var run = await db.ContentGenerationRuns.FirstOrDefaultAsync(r => r.Id == runId).ConfigureAwait(false);
                if (run == null)
                {
                    return;
                }

                run.Status = ContentGenerationRunStatuses.Running;
                run.StartedAt ??= DateTime.UtcNow;
                run.AttemptCount = attempt;
                await db.SaveChangesAsync().ConfigureAwait(false);

                var runTimeoutSeconds = Math.Max(1, _options.RunTimeoutSeconds);
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(runTimeoutSeconds));
                try
                {
                    var result = await generationService.GenerateAsync(request, cts.Token).ConfigureAwait(false);
                    var createdStats = result.CreatedStatistics.Count;
                    var createdAntystics = result.CreatedAntystics.Count;

                    run.CreatedStatisticsCount = createdStats;
                    run.CreatedAntysticsCount = createdAntystics;
                    run.DuplicateCount = result.SkippedDuplicates.Count;
                    run.SourceFailureCount = result.SourceFailures.Count;
                    run.ValidationFailureCount = result.ValidationIssues.Count;
                    run.ValidationIssuesJson = JsonSerializer.Serialize(result.ValidationIssues);
                    run.SourcePerformanceJson = result.SourcePerformanceJson;
                    run.SkippedSourcesJson = result.SkippedSourcesJson;

                    var hasTrustedData = createdStats > 0 || request.DryRun;
                    run.Status = hasTrustedData ? ContentGenerationRunStatuses.Succeeded : ContentGenerationRunStatuses.Failed;
                    run.ErrorMessage = hasTrustedData
                        ? null
                        : "Run completed without validated trusted statistics. Nothing was persisted.";
                    run.CompletedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync().ConfigureAwait(false);
                    return;
                }
                catch (OperationCanceledException) when (cts.IsCancellationRequested)
                {
                    // The per-attempt run-timeout budget was exhausted.
                    // This is a deterministic budget failure, not a transient network blip —
                    // retrying would hit the same wall. Fail immediately and record diagnostics.
                    run.ErrorMessage = $"Run timed out after {runTimeoutSeconds} s (RunTimeoutSeconds). " +
                                       "Consider increasing ContentGeneration:RunTimeoutSeconds or reducing active source count.";
                    run.CompletedAt = DateTime.UtcNow;
                    run.Status = ContentGenerationRunStatuses.Failed;
                    await db.SaveChangesAsync().ConfigureAwait(false);
                    _logger.LogError(
                        "Content generation run {RunId} timed out after {TimeoutSeconds} s on attempt {Attempt}. " +
                        "Marking failed without retry.",
                        runId, runTimeoutSeconds, attempt);
                    return;
                }
                catch (Exception ex)
                {
                    var isLastAttempt = attempt >= Math.Max(1, _options.RunMaxAttempts);
                    run.ErrorMessage = ex.Message;
                    run.CompletedAt = isLastAttempt ? DateTime.UtcNow : null;
                    run.Status = isLastAttempt ? ContentGenerationRunStatuses.Failed : ContentGenerationRunStatuses.Running;
                    await db.SaveChangesAsync().ConfigureAwait(false);

                    if (isLastAttempt)
                    {
                        _logger.LogError(ex, "Content generation run {RunId} failed after {Attempts} attempts.", runId, attempt);
                        return;
                    }

                    var delayMs = (int)Math.Pow(2, attempt) * Math.Max(500, _options.RetryBaseDelaySeconds * 1000);
                    _logger.LogWarning(ex, "Content generation run {RunId} attempt {Attempt} failed. Retrying in {DelayMs} ms.", runId, attempt, delayMs);
                    await Task.Delay(delayMs).ConfigureAwait(false);
                }
            }
        }
        finally
        {
            RunGate.Release();
        }
    }

    public async Task<bool> CancelRunAsync(Guid runId, string reason, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var run = await db.ContentGenerationRuns
            .FirstOrDefaultAsync(r => r.Id == runId, cancellationToken)
            .ConfigureAwait(false);

        if (run == null)
        {
            return false;
        }

        if (run.Status is ContentGenerationRunStatuses.Succeeded or ContentGenerationRunStatuses.Failed)
        {
            // Already terminal — nothing to do but report success so the caller
            // knows the run is no longer blocking the queue.
            return true;
        }

        run.Status = ContentGenerationRunStatuses.Failed;
        run.ErrorMessage = reason;
        run.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogWarning("Run {RunId} force-cancelled. Reason: {Reason}", runId, reason);
        return true;
    }

    public async Task RecoverOrphanedRunsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var orphans = await db.ContentGenerationRuns
            .Where(r => r.Status == ContentGenerationRunStatuses.Queued
                     || r.Status == ContentGenerationRunStatuses.Running)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        if (orphans.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        foreach (var run in orphans)
        {
            run.Status = ContentGenerationRunStatuses.Failed;
            run.ErrorMessage = "Orphaned: process restarted before run completed.";
            run.CompletedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogWarning(
            "Startup orphan recovery: marked {Count} run(s) as failed. Ids: {Ids}",
            orphans.Count,
            string.Join(", ", orphans.Select(r => r.Id)));
    }

    private static ContentGenerationRunView Map(ContentGenerationRun run)
    {
        object? issues = null;
        if (!string.IsNullOrWhiteSpace(run.ValidationIssuesJson))
        {
            try
            {
                issues = JsonSerializer.Deserialize<object>(run.ValidationIssuesJson);
            }
            catch
            {
                issues = run.ValidationIssuesJson;
            }
        }

        return new ContentGenerationRunView
        {
            Id = run.Id,
            Trigger = run.Trigger,
            DryRun = run.DryRun,
            Status = run.Status,
            CreatedAt = run.CreatedAt,
            StartedAt = run.StartedAt,
            CompletedAt = run.CompletedAt,
            RequestedBy = run.RequestedBy,
            RequestedStatistics = run.RequestedStatistics,
            RequestedAntystics = run.RequestedAntystics,
            AttemptCount = run.AttemptCount,
            CreatedStatisticsCount = run.CreatedStatisticsCount,
            CreatedAntysticsCount = run.CreatedAntysticsCount,
            DuplicateCount = run.DuplicateCount,
            SourceFailureCount = run.SourceFailureCount,
            ValidationFailureCount = run.ValidationFailureCount,
            ValidationIssues = issues,
            ErrorMessage = run.ErrorMessage
        };
    }
}

public sealed record ContentGenerationRunStartResult
{
    public bool Accepted { get; init; }
    public Guid? RunId { get; init; }
    public Guid? ActiveRunId { get; init; }
    public string Message { get; init; } = string.Empty;
}

public sealed record ContentGenerationRunView
{
    public Guid Id { get; init; }
    public string Trigger { get; init; } = string.Empty;
    public bool DryRun { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? RequestedBy { get; init; }
    public int RequestedStatistics { get; init; }
    public int RequestedAntystics { get; init; }
    public int AttemptCount { get; init; }
    public int CreatedStatisticsCount { get; init; }
    public int CreatedAntysticsCount { get; init; }
    public int DuplicateCount { get; init; }
    public int SourceFailureCount { get; init; }
    public int ValidationFailureCount { get; init; }
    public object? ValidationIssues { get; init; }
    public string? ErrorMessage { get; init; }
}
