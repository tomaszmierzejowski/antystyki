using System;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Antystics.Api.ContentGeneration.Services;

internal sealed class ContentGenerationHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ContentGenerationOptions _options;
    private readonly ILogger<ContentGenerationHostedService> _logger;

    public ContentGenerationHostedService(
        IServiceScopeFactory scopeFactory,
        IOptions<ContentGenerationOptions> options,
        ILogger<ContentGenerationHostedService> logger)
    {
        _scopeFactory = scopeFactory;
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

        _logger.LogInformation("Content generation hosted service starting. Daily run scheduled at {Time} local time.", _options.DailyRunLocalTime);

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

            await RunGenerationAsync(stoppingToken).ConfigureAwait(false);
        }

        _logger.LogInformation("Content generation hosted service stopping.");
    }

    private async Task RunGenerationAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting daily content generation run at {Time}", DateTimeOffset.UtcNow);

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IContentGenerationService>();

            var request = new ContentGenerationRequest
            {
                DryRun = false,
                ExecutionTime = DateTimeOffset.UtcNow
            };

            var result = await service.GenerateAsync(request, cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "Content generation completed: {StatsCount} statistics, {AntysticsCount} antystics created. Skipped duplicates: {Duplicates}. Source failures: {Failures}.",
                result.CreatedStatistics.Count,
                result.CreatedAntystics.Count,
                result.SkippedDuplicates.Count,
                result.SourceFailures.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Content generation run failed with error: {Message}", ex.Message);
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
