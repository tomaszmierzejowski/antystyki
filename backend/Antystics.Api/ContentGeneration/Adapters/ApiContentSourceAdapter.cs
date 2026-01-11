using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Models;
using Microsoft.Extensions.Logging;

namespace Antystics.Api.ContentGeneration.Adapters;

internal sealed class ApiContentSourceAdapter : IContentSourceAdapter
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ApiContentSourceAdapter> _logger;
    private static readonly Regex NumberRegex = new(@"(\d+[.,]?\d*\%?)", RegexOptions.Compiled);
    private const int MaxItems = 25;

    public ApiContentSourceAdapter(IHttpClientFactory httpClientFactory, ILogger<ApiContentSourceAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool CanHandle(ContentSourceType type) => type == ContentSourceType.Api;

    public async Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(15);

        try
        {
            using var response = await client.GetAsync(source.Endpoint, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("API fetch failed for {Source} with status {StatusCode}", source.Id, response.StatusCode);
                return Array.Empty<SourceItem>();
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            if (string.IsNullOrWhiteSpace(content))
            {
                return Array.Empty<SourceItem>();
            }

            return TryExtractJsonItems(content, source)
                .Take(MaxItems)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "API fetch failed for {Source}", source.Id);
            return Array.Empty<SourceItem>();
        }
    }

    private IReadOnlyCollection<SourceItem> TryExtractJsonItems(string json, ContentSource source)
    {
        var results = new List<SourceItem>();

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var element in doc.RootElement.EnumerateArray())
                {
                    CollectElement(element, source, results);
                }
            }
            else
            {
                CollectElement(doc.RootElement, source, results);
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "JSON parsing failed for {Source}", source.Id);
        }

        return results;
    }

    private void CollectElement(JsonElement element, ContentSource source, ICollection<SourceItem> results)
    {
        var flattened = Flatten(element)
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Distinct()
            .ToList();

        foreach (var value in flattened)
        {
            if (!NumberRegex.IsMatch(value))
            {
                continue;
            }

            results.Add(new SourceItem
            {
                SourceId = source.Id,
                SourceName = source.Name,
                Title = Trim(value, 140),
                Summary = Trim(value, 280),
                SourceUrl = source.Endpoint,
                PublishedAt = null,
                Topics = source.Topics,
                Tags = source.Tags,
                PolandFocus = source.PolandFocus,
                HumorFriendly = source.HumorFriendly
            });
        }
    }

    private static IEnumerable<string> Flatten(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    foreach (var nested in Flatten(property.Value))
                    {
                        yield return nested;
                    }
                }
                break;
            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    foreach (var nested in Flatten(item))
                    {
                        yield return nested;
                    }
                }
                break;
            case JsonValueKind.String:
                yield return element.GetString() ?? string.Empty;
                break;
            case JsonValueKind.Number:
                yield return element.ToString();
                break;
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
