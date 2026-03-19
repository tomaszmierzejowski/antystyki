using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Models;
using Antystics.Api.ContentGeneration.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/admin/content-generation")]
[Authorize(Roles = "Admin,Moderator")]
public sealed class AdminContentGenerationController : ControllerBase
{
    private readonly IContentGenerationRunOrchestrator _runOrchestrator;
    private readonly ILogger<AdminContentGenerationController> _logger;

    public AdminContentGenerationController(
        IContentGenerationRunOrchestrator runOrchestrator,
        ILogger<AdminContentGenerationController> logger)
    {
        _runOrchestrator = runOrchestrator;
        _logger = logger;
    }

    [HttpPost("run")]
    public async Task<IActionResult> RunGeneration([FromBody] RunGenerationRequest request, CancellationToken cancellationToken)
    {
        var req = new ContentGenerationRequest
        {
            DryRun = request.DryRun,
            AllowDuplicates = request.AllowDuplicates,
            TargetStatistics = request.Statistics ?? request.TargetStatistics,
            TargetAntystics = request.Antystics ?? request.TargetAntystics,
            SourceIds = request.SourceIds,
            ExecutionTime = request.ExecutionTime ?? DateTimeOffset.UtcNow
        };

        var requestedBy = User.FindFirstValue(ClaimTypes.Email)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? "unknown";

        var queued = await _runOrchestrator
            .QueueRunAsync(req, trigger: "manual", requestedBy: requestedBy, cancellationToken)
            .ConfigureAwait(false);

        if (!queued.Accepted)
        {
            _logger.LogWarning("Manual generation request rejected: {Message}. ActiveRunId={ActiveRunId}", queued.Message, queued.ActiveRunId);
            return Conflict(new
            {
                queued.Message,
                queued.ActiveRunId
            });
        }

        return Accepted(new
        {
            queued.Message,
            queued.RunId,
            statusUrl = Url.Action(nameof(GetRunStatus), values: new { runId = queued.RunId })
        });
    }

    [HttpGet("runs/{runId:guid}")]
    public async Task<IActionResult> GetRunStatus(Guid runId, CancellationToken cancellationToken)
    {
        var run = await _runOrchestrator.GetRunAsync(runId, cancellationToken).ConfigureAwait(false);
        if (run == null)
        {
            return NotFound();
        }

        return Ok(run);
    }

    [HttpPost("runs/{runId:guid}/cancel")]
    public async Task<IActionResult> CancelRun(Guid runId, CancellationToken cancellationToken)
    {
        var requestedBy = User.FindFirstValue(ClaimTypes.Email)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? "unknown";

        var cancelled = await _runOrchestrator
            .CancelRunAsync(runId, $"Manually cancelled by {requestedBy}.", cancellationToken)
            .ConfigureAwait(false);

        if (!cancelled)
        {
            return NotFound(new { message = $"Run {runId} not found." });
        }

        _logger.LogInformation("Run {RunId} force-cancelled by {RequestedBy}.", runId, requestedBy);
        return Ok(new { message = $"Run {runId} has been cancelled." });
    }
}

public sealed class RunGenerationRequest
{
    /// <summary>
    /// If true, nothing is persisted; a summary is returned.
    /// </summary>
    public bool DryRun { get; set; }

    /// <summary>
    /// Target statistics count (deprecated alias TargetStatistics kept for compatibility).
    /// </summary>
    public int? Statistics { get; set; }

    public int? TargetStatistics { get; set; }

    /// <summary>
    /// Target antystics count (deprecated alias TargetAntystics kept for compatibility).
    /// </summary>
    public int? Antystics { get; set; }

    public int? TargetAntystics { get; set; }

    /// <summary>
    /// Optional list of source IDs to restrict the run.
    /// </summary>
    public List<string>? SourceIds { get; set; }

    /// <summary>
    /// Optional execution time override (ISO-8601).
    /// </summary>
    [DataType(DataType.DateTime)]
    public DateTimeOffset? ExecutionTime { get; set; }

    /// <summary>
    /// When true, bypasses same-day generation-key duplicate protection.
    /// </summary>
    public bool AllowDuplicates { get; set; }
}
