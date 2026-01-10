using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Models;
using Microsoft.Extensions.Logging;

namespace Antystics.Api.ContentGeneration.Adapters;

internal sealed class WebContentSourceAdapter : IContentSourceAdapter
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<WebContentSourceAdapter> _logger;
    private static readonly Regex SentenceRegex = new(@"([^.?!]{12,240}[.?!])", RegexOptions.Compiled);
    private static readonly Regex NumberRegex = new(@"(\d+[.,]?\d*\%?)", RegexOptions.Compiled);

    public WebContentSourceAdapter(IHttpClientFactory httpClientFactory, ILogger<WebContentSourceAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool CanHandle(ContentSourceType type) => type == ContentSourceType.Web;

    public async Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(12);

        try
        {
            using var response = await client.GetAsync(source.Endpoint, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Web fetch failed for {Source} with status {StatusCode}", source.Id, response.StatusCode);
                return Array.Empty<SourceItem>();
            }

            var html = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            var sentences = SentenceRegex.Matches(html ?? string.Empty)
                .Select(m => m.Value.Trim())
                .Where(s => NumberRegex.IsMatch(s))
                .Take(20)
                .ToList();

            return sentences.Select(sentence => new SourceItem
            {
                SourceId = source.Id,
                SourceName = source.Name,
                Title = Trim(sentence, 140),
                Summary = Trim(sentence, 280),
                SourceUrl = source.Endpoint,
                PublishedAt = null,
                Topics = source.Topics,
                Tags = source.Tags,
                PolandFocus = source.PolandFocus,
                HumorFriendly = source.HumorFriendly
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Web fetch failed for {Source}", source.Id);
            return Array.Empty<SourceItem>();
        }
    }

    private static string Trim(string value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }
}
