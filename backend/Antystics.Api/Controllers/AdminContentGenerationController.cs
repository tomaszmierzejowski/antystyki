using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Models;
using Antystics.Api.ContentGeneration.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/admin/content-generation")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminContentGenerationController : ControllerBase
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AdminContentGenerationController> _logger;

    public AdminContentGenerationController(IServiceScopeFactory scopeFactory, ILogger<AdminContentGenerationController> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    [HttpPost("run")]
    public IActionResult RunGeneration([FromBody] RunGenerationRequest request)
    {
        var req = new ContentGenerationRequest
        {
            DryRun = request.DryRun,
            TargetStatistics = request.Statistics ?? request.TargetStatistics,
            TargetAntystics = request.Antystics ?? request.TargetAntystics,
            SourceIds = request.SourceIds,
            ExecutionTime = request.ExecutionTime ?? DateTimeOffset.UtcNow
        };

        _logger.LogInformation("Accepting manual generation request. Background processing started.");

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var generationService = scope.ServiceProvider.GetRequiredService<IContentGenerationService>();
                
                // Do not pass the Controller's CancellationToken
                // because it aborts when the HTTP request ends.
                var result = await generationService.GenerateAsync(req, CancellationToken.None).ConfigureAwait(false);
                
                _logger.LogWarning(
                    "Content generation finished: {Stats} statistics, {Antys} antystics created. {Rejected} items rejected during validation. DryRun={DryRun}.",
                    result.CreatedStatistics.Count, result.CreatedAntystics.Count, result.ValidationIssues.Count, result.DryRun);

                if (result.CreatedStatistics.Count == 0 && result.ValidationIssues.Count > 0)
                {
                    var rejectionSummary = string.Join(" | ", result.ValidationIssues
                        .GroupBy(v => v.Reason)
                        .Select(g => $"{g.Key} ({g.Count()}x)"));
                    _logger.LogError("All items rejected — no statistics generated. Rejection summary: {Summary}", rejectionSummary);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background manual generation failed.");
            }
        });

        return Accepted(new { Message = "Generation started in the background. Check logs or database for results." });
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
