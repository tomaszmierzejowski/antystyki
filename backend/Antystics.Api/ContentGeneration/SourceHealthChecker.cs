using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Antystics.Api.ContentGeneration;

public interface ISourceHealthChecker
{
    Task<bool> IsHealthyAsync(ContentSource source, TimeSpan timeout, CancellationToken cancellationToken);
}

internal sealed class SourceHealthChecker : ISourceHealthChecker
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ContentGenerationOptions _options;
    private readonly ILogger<SourceHealthChecker> _logger;

    public SourceHealthChecker(
        IHttpClientFactory httpClientFactory,
        IOptions<ContentGenerationOptions> options,
        ILogger<SourceHealthChecker> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<bool> IsHealthyAsync(ContentSource source, TimeSpan timeout, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient("content-generation");
        client.Timeout = timeout;

        var maxAttempts = Math.Max(1, _options.SourceHealthMaxAttempts);
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, source.HealthCheckUrl);
                using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);

                var statusCode = (int)response.StatusCode;
                var isHealthy = statusCode >= 200 && statusCode < 400;

                if (isHealthy)
                {
                    return true;
                }

                _logger.LogWarning("Health check FAILED for source {Source}: HTTP {StatusCode} (attempt {Attempt}/{MaxAttempts})", source.Id, statusCode, attempt, maxAttempts);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning("Health check FAILED for source {Source} (network error on attempt {Attempt}/{MaxAttempts}): {Message}", source.Id, attempt, maxAttempts, ex.Message);
            }
            catch (TaskCanceledException ex) when (ex.CancellationToken != cancellationToken)
            {
                _logger.LogWarning("Health check TIMED OUT for source {Source} on attempt {Attempt}/{MaxAttempts}", source.Id, attempt, maxAttempts);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Health check FAILED for source {Source} on attempt {Attempt}/{MaxAttempts}", source.Id, attempt, maxAttempts);
            }

            if (attempt < maxAttempts)
            {
                var delayMs = (int)Math.Pow(2, attempt) * Math.Max(500, _options.RetryBaseDelaySeconds * 1000);
                await Task.Delay(delayMs, cancellationToken).ConfigureAwait(false);
            }
        }

        return false;
    }
}
