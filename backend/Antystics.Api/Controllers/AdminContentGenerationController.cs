using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Models;
using Antystics.Api.ContentGeneration.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/admin/content-generation")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminContentGenerationController : ControllerBase
{
    private readonly IContentGenerationService _generationService;

    public AdminContentGenerationController(IContentGenerationService generationService)
    {
        _generationService = generationService;
    }

    [HttpPost("run")]
    public async Task<ActionResult<ContentGenerationResult>> RunGeneration(
        [FromBody] RunGenerationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _generationService.GenerateAsync(new ContentGenerationRequest
        {
            DryRun = request.DryRun,
            TargetStatistics = request.Statistics ?? request.TargetStatistics,
            TargetAntystics = request.Antystics ?? request.TargetAntystics,
            SourceIds = request.SourceIds,
            ExecutionTime = request.ExecutionTime ?? DateTimeOffset.UtcNow
        }, cancellationToken).ConfigureAwait(false);

        return Ok(result);
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
}
