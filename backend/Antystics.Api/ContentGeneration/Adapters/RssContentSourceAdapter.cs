using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.ServiceModel.Syndication;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Xml;
using Antystics.Api.ContentGeneration.Models;
using Microsoft.Extensions.Logging;

namespace Antystics.Api.ContentGeneration.Adapters;

internal sealed class RssContentSourceAdapter : IContentSourceAdapter
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RssContentSourceAdapter> _logger;

    public RssContentSourceAdapter(IHttpClientFactory httpClientFactory, ILogger<RssContentSourceAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool CanHandle(ContentSourceType type) => type == ContentSourceType.Rss;

    public async Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient("content-generation");

        try
        {
            using var response = await client.GetAsync(source.Endpoint, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("RSS fetch failed for {Source} with status {StatusCode}", source.Id, response.StatusCode);
                return Array.Empty<SourceItem>();
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
            using var xmlReader = XmlReader.Create(stream);
            var feed = SyndicationFeed.Load(xmlReader);
            if (feed == null)
            {
                return Array.Empty<SourceItem>();
            }

            var items = feed.Items.Select(item =>
            {
                var published = item.PublishDate != default ? item.PublishDate : item.LastUpdatedTime;
                var rawTitle = item.Title?.Text ?? string.Empty;
                var rawSummary = item.Summary?.Text ?? string.Empty;
                var title = ContentSanitizer.CleanText(rawTitle, 180);
                var summary = ContentSanitizer.CleanText(string.IsNullOrWhiteSpace(rawSummary) ? rawTitle : rawSummary, 400);
                var link = GetBestLink(item) ?? source.Endpoint;

                if (string.IsNullOrWhiteSpace(title) || ContentSanitizer.HasHtmlNoise(title) || ContentSanitizer.HasHtmlNoise(summary))
                {
                    return null;
                }

                return new SourceItem
                {
                    SourceId = source.Id,
                    SourceName = source.Name,
                    Title = title,
                    Summary = summary,
                    SourceUrl = link,
                    PublishedAt = published == default ? null : published,
                    Topics = source.Topics,
                    Tags = source.Tags,
                    PolandFocus = source.PolandFocus,
                    HumorFriendly = source.HumorFriendly,
                    GeoFocus = source.GeoFocus,
                    Publisher = source.Name
                };
            })
            .Where(i => i != null && !string.IsNullOrWhiteSpace(i.SourceUrl))
            .Cast<SourceItem>()
            .Take(50)
            .ToList();

            return items;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "RSS fetch failed for {Source}", source.Id);
            return Array.Empty<SourceItem>();
        }
    }

    private static string? GetBestLink(SyndicationItem item)
    {
        var link = item.Links?.FirstOrDefault(l => l.Uri != null)?.Uri?.ToString();
        if (!string.IsNullOrWhiteSpace(link))
        {
            return link.Trim();
        }

        if (!string.IsNullOrWhiteSpace(item.Id) && Uri.IsWellFormedUriString(item.Id, UriKind.Absolute))
        {
            return item.Id.Trim();
        }

        return null;
    }
}
