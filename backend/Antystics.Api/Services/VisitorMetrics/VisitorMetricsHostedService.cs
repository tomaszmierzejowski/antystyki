using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Antystics.Api.Services.VisitorMetrics;

internal sealed class VisitorMetricsHostedService : BackgroundService
{
    private readonly IVisitorMetricsService _metricsService;
    private readonly VisitorMetricsOptions _options;
    private readonly ILogger<VisitorMetricsHostedService> _logger;

    public VisitorMetricsHostedService(
        IVisitorMetricsService metricsService,
        IOptions<VisitorMetricsOptions> options,
        ILogger<VisitorMetricsHostedService> logger)
    {
        _metricsService = metricsService;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var delay = TimeSpan.FromMinutes(Math.Max(1, _options.FlushIntervalMinutes));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await _metricsService.PersistAsync(stoppingToken).ConfigureAwait(false);
                var minimumDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-_options.RetentionDays));
                await _metricsService.RemoveExpiredDataAsync(minimumDate, stoppingToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to flush visitor metrics");
            }

            try
            {
                await Task.Delay(delay, stoppingToken).ConfigureAwait(false);
            }
            catch (TaskCanceledException)
            {
                // ignored
            }
        }
    }
}
