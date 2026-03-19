using System;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Antystics.Api.ContentGeneration.Services;

internal sealed class ContentGenerationHostedService : BackgroundService
{
    private readonly IContentGenerationRunOrchestrator _runOrchestrator;
    private readonly ContentGenerationOptions _options;
    private readonly ILogger<ContentGenerationHostedService> _logger;

    public ContentGenerationHostedService(
        IContentGenerationRunOrchestrator runOrchestrator,
        IOptions<ContentGenerationOptions> options,
        ILogger<ContentGenerationHostedService> logger)
    {
        _runOrchestrator = runOrchestrator;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Content generation is disabled via configuration.");
            return;
        }

        // Recover any runs that were left in Queued/Running state by a previous
        // process crash or deployment rollout before the scheduler loop starts.
        await _runOrchestrator.RecoverOrphanedRunsAsync(stoppingToken).ConfigureAwait(false);

        _logger.LogInformation("Content generation hosted service starting. Daily run scheduled at {Time} local time.", _options.DailyRunLocalTime);

        if (_options.RunAtStartup && !stoppingToken.IsCancellationRequested)
        {
            var startupDelay = TimeSpan.FromSeconds(Math.Max(0, _options.StartupDelaySeconds));
            if (startupDelay > TimeSpan.Zero)
            {
                _logger.LogInformation("Initial content generation run scheduled after startup delay {Delay}.", startupDelay);
                try
                {
                    await Task.Delay(startupDelay, stoppingToken).ConfigureAwait(false);
                }
                catch (TaskCanceledException)
                {
                    return;
                }
            }

            await QueueRunAsync("startup", stoppingToken).ConfigureAwait(false);
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            var targetTime = ParseLocalTime(_options.DailyRunLocalTime);
            var nextRun = now.Date.Add(targetTime);

            if (nextRun <= now)
            {
                nextRun = nextRun.AddDays(1);
            }

            var delay = nextRun - now;
            _logger.LogDebug("Next content generation run scheduled at {NextRun} (in {Delay})", nextRun, delay);

            try
            {
                await Task.Delay(delay, stoppingToken).ConfigureAwait(false);
            }
            catch (TaskCanceledException)
            {
                break;
            }

            if (stoppingToken.IsCancellationRequested)
            {
                break;
            }

            await QueueRunAsync("scheduled", stoppingToken).ConfigureAwait(false);
        }

        _logger.LogInformation("Content generation hosted service stopping.");
    }

    private async Task QueueRunAsync(string trigger, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Queueing {Trigger} content generation run at {Time}", trigger, DateTimeOffset.UtcNow);

        try
        {
            var request = new ContentGenerationRequest
            {
                DryRun = false,
                AllowDuplicates = false,
                ExecutionTime = DateTimeOffset.UtcNow
            };

            var queued = await _runOrchestrator
                .QueueRunAsync(request, trigger, requestedBy: "system", cancellationToken)
                .ConfigureAwait(false);

            if (!queued.Accepted)
            {
                _logger.LogWarning("Unable to queue {Trigger} content generation run: {Message}. ActiveRunId={ActiveRunId}", trigger, queued.Message, queued.ActiveRunId);
                return;
            }

            _logger.LogInformation("Queued {Trigger} content generation run. RunId={RunId}", trigger, queued.RunId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to queue {Trigger} content generation run.", trigger);
        }
    }

    private static TimeSpan ParseLocalTime(string timeString)
    {
        if (TimeSpan.TryParse(timeString, out var result))
        {
            return result;
        }

        // Default to 07:00 if parsing fails
        return new TimeSpan(7, 0, 0);
    }
}
