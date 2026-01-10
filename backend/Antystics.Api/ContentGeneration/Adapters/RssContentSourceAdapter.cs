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
    private static readonly Regex HtmlTagRegex = new("<.*?>", RegexOptions.Compiled);

    public RssContentSourceAdapter(IHttpClientFactory httpClientFactory, ILogger<RssContentSourceAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool CanHandle(ContentSourceType type) => type == ContentSourceType.Rss;

    public async Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(15);

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

            return feed.Items.Select(item =>
            {
                var published = item.PublishDate != default ? item.PublishDate : item.LastUpdatedTime;
                var link = item.Links.FirstOrDefault()?.Uri?.ToString() ?? source.Endpoint;
                var rawSummary = item.Summary?.Text ?? item.Title?.Text ?? string.Empty;
                var summary = HtmlTagRegex.Replace(rawSummary, string.Empty);

                return new SourceItem
                {
                    SourceId = source.Id,
                    SourceName = source.Name,
                    Title = (item.Title?.Text ?? string.Empty).Trim(),
                    Summary = summary.Trim(),
                    SourceUrl = link,
                    PublishedAt = published == default ? null : published,
                    Topics = source.Topics,
                    Tags = source.Tags,
                    PolandFocus = source.PolandFocus,
                    HumorFriendly = source.HumorFriendly
                };
            })
            .Where(i => !string.IsNullOrWhiteSpace(i.Title) && !string.IsNullOrWhiteSpace(i.SourceUrl))
            .Take(50)
            .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "RSS fetch failed for {Source}", source.Id);
            return Array.Empty<SourceItem>();
        }
    }
}
