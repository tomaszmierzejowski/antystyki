using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration;
using Antystics.Api.ContentGeneration.Models;
using Antystics.Api.ContentGeneration.Services;
using Antystics.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace Antystics.Api.Tests;

public class ContentGenerationRunOrchestratorTests
{
    [Fact]
    public async Task QueueRunAsync_ManualPath_CompletesWithSucceededStatus()
    {
        var fakeService = new FakeGenerationService(delayMs: 0);
        var provider = BuildServices(fakeService);
        var orchestrator = provider.GetRequiredService<IContentGenerationRunOrchestrator>();

        var started = await orchestrator.QueueRunAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 1,
            TargetAntystics = 1
        }, "manual", "moderator@antystyki.pl", CancellationToken.None);

        Assert.True(started.Accepted);
        Assert.NotNull(started.RunId);

        var run = await WaitForTerminalState(orchestrator, started.RunId!.Value);
        Assert.NotNull(run);
        Assert.Equal("manual", run!.Trigger);
        Assert.Equal("succeeded", run.Status);
        Assert.Equal(1, run.CreatedStatisticsCount);
        Assert.Equal(1, run.CreatedAntysticsCount);
    }

    [Fact]
    public async Task QueueRunAsync_ScheduledPath_CompletesWithSucceededStatus()
    {
        var fakeService = new FakeGenerationService(delayMs: 0);
        var provider = BuildServices(fakeService);
        var orchestrator = provider.GetRequiredService<IContentGenerationRunOrchestrator>();

        var started = await orchestrator.QueueRunAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 1,
            TargetAntystics = 0
        }, "scheduled", "system", CancellationToken.None);

        Assert.True(started.Accepted);
        Assert.NotNull(started.RunId);

        var run = await WaitForTerminalState(orchestrator, started.RunId!.Value);
        Assert.NotNull(run);
        Assert.Equal("scheduled", run!.Trigger);
        Assert.Equal("succeeded", run.Status);
        Assert.Equal(1, run.CreatedStatisticsCount);
    }

    [Fact]
    public async Task QueueRunAsync_TimeoutCancellation_FailsWithTimeoutMessage_NoRetry()
    {
        // Arrange: service that delays longer than the configured run timeout.
        var fakeService = new FakeGenerationService(delayMs: 5000);
        // RunTimeoutSeconds = 1 s so it fires immediately; RunMaxAttempts = 2 to confirm no retry occurs.
        var provider = BuildServices(fakeService, runTimeoutSeconds: 1, runMaxAttempts: 2);
        var orchestrator = provider.GetRequiredService<IContentGenerationRunOrchestrator>();

        var started = await orchestrator.QueueRunAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 1,
            TargetAntystics = 0
        }, "manual", "moderator@antystyki.pl", CancellationToken.None);

        Assert.True(started.Accepted);

        var run = await WaitForTerminalState(orchestrator, started.RunId!.Value, timeoutSecs: 8);

        Assert.NotNull(run);
        Assert.Equal("failed", run!.Status);
        // Must mention the timeout so moderator has actionable info.
        Assert.Contains("timed out", run.ErrorMessage, StringComparison.OrdinalIgnoreCase);
        // AttemptCount must be 1: no retry after a timeout.
        Assert.Equal(1, run.AttemptCount);
    }

    [Fact]
    public async Task QueueRunAsync_RejectsConcurrentRun()
    {
        var fakeService = new FakeGenerationService(delayMs: 700);
        var provider = BuildServices(fakeService);
        var orchestrator = provider.GetRequiredService<IContentGenerationRunOrchestrator>();

        var first = await orchestrator.QueueRunAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 1,
            TargetAntystics = 0
        }, "manual", "moderator@antystyki.pl", CancellationToken.None);

        Assert.True(first.Accepted);
        Assert.NotNull(first.RunId);

        // Give background task a short head start so it marks run as queued/running.
        await Task.Delay(50);

        var second = await orchestrator.QueueRunAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 1,
            TargetAntystics = 0
        }, "manual", "moderator@antystyki.pl", CancellationToken.None);

        Assert.False(second.Accepted);
        Assert.NotNull(second.ActiveRunId);
    }

    private static async Task<ContentGenerationRunView?> WaitForTerminalState(
        IContentGenerationRunOrchestrator orchestrator,
        Guid runId,
        int timeoutSecs = 8)
    {
        var deadline = DateTime.UtcNow.AddSeconds(timeoutSecs);
        while (DateTime.UtcNow < deadline)
        {
            var run = await orchestrator.GetRunAsync(runId, CancellationToken.None);
            if (run != null && (run.Status == "succeeded" || run.Status == "failed"))
            {
                return run;
            }

            await Task.Delay(100);
        }

        return await orchestrator.GetRunAsync(runId, CancellationToken.None);
    }

    private static ServiceProvider BuildServices(
        FakeGenerationService fakeService,
        int runTimeoutSeconds = 30,
        int runMaxAttempts = 1)
    {
        var services = new ServiceCollection();
        var dbName = $"content-generation-run-tests-{Guid.NewGuid()}";
        services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(dbName));
        services.AddSingleton(fakeService);
        services.AddScoped<IContentGenerationService>(sp => sp.GetRequiredService<FakeGenerationService>());
        services.AddSingleton<IContentGenerationRunOrchestrator, ContentGenerationRunOrchestrator>();
        services.AddSingleton<IOptions<ContentGenerationOptions>>(Options.Create(new ContentGenerationOptions
        {
            RunTimeoutSeconds = runTimeoutSeconds,
            RunMaxAttempts = runMaxAttempts,
            RetryBaseDelaySeconds = 1,
            HttpTimeoutSeconds = 10
        }));
        services.AddSingleton(NullLogger<ContentGenerationRunOrchestrator>.Instance);
        services.AddLogging();
        return services.BuildServiceProvider();
    }

    private sealed class FakeGenerationService : IContentGenerationService
    {
        private readonly int _delayMs;

        public FakeGenerationService(int delayMs)
        {
            _delayMs = delayMs;
        }

        public async Task<ContentGenerationResult> GenerateAsync(ContentGenerationRequest request, CancellationToken cancellationToken)
        {
            if (_delayMs > 0)
            {
                await Task.Delay(_delayMs, cancellationToken);
            }

            return new ContentGenerationResult
            {
                DryRun = request.DryRun,
                ExecutedAt = DateTimeOffset.UtcNow,
                CreatedStatistics = new List<GeneratedDraft>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        Kind = "statistic",
                        Title = "42% test",
                        Summary = "Test summary",
                        SourceUrl = "http://example.com",
                        SourceCitation = "Test source"
                    }
                },
                CreatedAntystics = request.TargetAntystics.GetValueOrDefault() > 0
                    ? new List<GeneratedDraft>
                    {
                        new()
                        {
                            Id = Guid.NewGuid(),
                            Kind = "antystyk",
                            Title = "Test antystyk",
                            Summary = "Ironia",
                            SourceUrl = "http://example.com",
                            SourceCitation = "Test source"
                        }
                    }
                    : Array.Empty<GeneratedDraft>(),
                ValidationIssues = Array.Empty<ValidationIssue>(),
                ValidationFailures = Array.Empty<string>(),
                SourceFailures = Array.Empty<string>(),
                SkippedDuplicates = Array.Empty<string>(),
                Outcome = "succeeded"
            };
        }
    }
}
