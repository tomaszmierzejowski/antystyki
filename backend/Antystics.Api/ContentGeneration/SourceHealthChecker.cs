using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Antystics.Api.ContentGeneration;

public interface ISourceHealthChecker
{
    Task<bool> IsHealthyAsync(ContentSource source, TimeSpan timeout, CancellationToken cancellationToken);
}

internal sealed class SourceHealthChecker : ISourceHealthChecker
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SourceHealthChecker> _logger;

    public SourceHealthChecker(IHttpClientFactory httpClientFactory, ILogger<SourceHealthChecker> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<bool> IsHealthyAsync(ContentSource source, TimeSpan timeout, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = timeout;

        try
        {
            using var response = await client.GetAsync(source.HealthCheckUrl, cancellationToken).ConfigureAwait(false);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Health check failed for {Source}", source.Id);
            return false;
        }
    }
}
