using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net;
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
    private static readonly Regex TitleRegex = new(@"<title[^>]*>(?<val>.*?)<\/title>", RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Singleline);
    private static readonly Regex OgTitleRegex = new(@"<meta[^>]+property=[""']og:title[""'][^>]+content=[""'](?<val>[^""']+)[""'][^>]*>", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex MetaDescriptionRegex = new(@"<meta[^>]+name=[""']description[""'][^>]+content=[""'](?<val>[^""']+)[""'][^>]*>", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex CanonicalRegex = new(@"<link[^>]+rel=[""']canonical[""'][^>]+href=[""'](?<val>[^""']+)[""'][^>]*>", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex NumberRegex = new(@"(\d+[.,]?\d*\%?)", RegexOptions.Compiled);

    public WebContentSourceAdapter(IHttpClientFactory httpClientFactory, ILogger<WebContentSourceAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool CanHandle(ContentSourceType type) => type == ContentSourceType.Web;

    public async Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient("content-generation");

        try
        {
            using var response = await client.GetAsync(source.Endpoint, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Web fetch failed for {Source} with status {StatusCode}", source.Id, response.StatusCode);
                return Array.Empty<SourceItem>();
            }

            var html = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            var title = ExtractFirst(html, OgTitleRegex) ?? ExtractFirst(html, TitleRegex);
            var description = ExtractFirst(html, MetaDescriptionRegex);
            var candidate = title ?? description ?? string.Empty;
            var cleanedTitle = ContentSanitizer.CleanText(candidate, 180);
            var cleanedSummary = ContentSanitizer.CleanText(description ?? candidate, 400);

            if (ContentSanitizer.HasHtmlNoise(candidate) || string.IsNullOrWhiteSpace(cleanedTitle))
            {
                return Array.Empty<SourceItem>();
            }

            // Require at least one numeric hint to stay mission-aligned for stats
            if (!NumberRegex.IsMatch(cleanedTitle + " " + cleanedSummary))
            {
                return Array.Empty<SourceItem>();
            }

            var canonical = ExtractFirst(html, CanonicalRegex);
            var sourceUrl = !string.IsNullOrWhiteSpace(canonical) ? canonical!.Trim() : source.Endpoint;

            var item = new SourceItem
            {
                SourceId = source.Id,
                SourceName = source.Name,
                Title = cleanedTitle,
                Summary = string.IsNullOrWhiteSpace(cleanedSummary) ? cleanedTitle : cleanedSummary,
                SourceUrl = sourceUrl,
                PublishedAt = null,
                Topics = source.Topics,
                Tags = source.Tags,
                PolandFocus = source.PolandFocus,
                HumorFriendly = source.HumorFriendly,
                GeoFocus = source.GeoFocus,
                Publisher = source.Name
            };

            return new[] { item };
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Web fetch failed for {Source}", source.Id);
            return Array.Empty<SourceItem>();
        }
    }

    private static string? ExtractFirst(string html, Regex regex)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return null;
        }

        var match = regex.Match(html);
        if (!match.Success)
        {
            return null;
        }

        var val = match.Groups["val"].Value;
        return WebUtility.HtmlDecode(val);
    }
}
