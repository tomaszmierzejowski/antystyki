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
        var client = _httpClientFactory.CreateClient("content-generation");
        client.Timeout = timeout;

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, source.HealthCheckUrl);
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);
            
            // Accept success codes, redirects, and some specific codes that still indicate the service is up
            var statusCode = (int)response.StatusCode;
            var isHealthy = statusCode >= 200 && statusCode < 400;
            
            if (!isHealthy)
            {
                _logger.LogDebug("Health check for {Source} returned status {StatusCode}", source.Id, response.StatusCode);
            }
            
            return isHealthy;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogDebug(ex, "Health check HTTP error for {Source}: {Message}", source.Id, ex.Message);
            return false;
        }
        catch (TaskCanceledException ex) when (ex.CancellationToken != cancellationToken)
        {
            _logger.LogDebug("Health check timed out for {Source}", source.Id);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Health check failed for {Source}", source.Id);
            return false;
        }
    }
}
