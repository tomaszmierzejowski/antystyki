using System;
using System.Globalization;
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
        _logger = logger;
        _options = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var nextRun = GetNextRun(DateTimeOffset.Now);
            var delay = nextRun - DateTimeOffset.Now;
            if (delay < TimeSpan.Zero)
            {
                delay = TimeSpan.FromMinutes(1);
            }

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

            using var scope = _scopeFactory.CreateScope();
            var generationService = scope.ServiceProvider.GetRequiredService<IContentGenerationService>();

            try
            {
                _logger.LogInformation("Starting scheduled content generation for {RunTime}", nextRun);
                await generationService.GenerateAsync(new ContentGenerationRequest
                {
                    DryRun = false,
                    ExecutionTime = nextRun
                }, stoppingToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Scheduled content generation failed");
            }
        }
    }

    private DateTimeOffset GetNextRun(DateTimeOffset now)
    {
        if (!TimeSpan.TryParseExact(_options.DailyRunLocalTime, "hh\\:mm", CultureInfo.InvariantCulture, out var runTime))
        {
            runTime = new TimeSpan(7, 0, 0);
        }

        var todayRun = new DateTimeOffset(
            now.Year,
            now.Month,
            now.Day,
            runTime.Hours,
            runTime.Minutes,
            0,
            now.Offset);

        if (todayRun > now)
        {
            return todayRun;
        }

        return todayRun.AddDays(1);
    }
}
