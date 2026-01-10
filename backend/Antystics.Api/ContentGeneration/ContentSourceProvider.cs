using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Antystics.Api.ContentGeneration;

public interface IContentSourceProvider
{
    IReadOnlyCollection<ContentSource> GetAll();
}

internal sealed class ContentSourceProvider : IContentSourceProvider
{
    private readonly ILogger<ContentSourceProvider> _logger;
    private readonly string _sourcePath;
    private readonly Lazy<IReadOnlyCollection<ContentSource>> _sources;

    public ContentSourceProvider(
        IOptions<ContentGenerationOptions> options,
        IHostEnvironment environment,
        ILogger<ContentSourceProvider> logger)
    {
        _logger = logger;
        var optionsValue = options.Value;
        _sourcePath = Path.IsPathRooted(optionsValue.SourcesPath)
            ? optionsValue.SourcesPath
            : Path.Combine(environment.ContentRootPath, optionsValue.SourcesPath);

        _sources = new Lazy<IReadOnlyCollection<ContentSource>>(LoadSources, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public IReadOnlyCollection<ContentSource> GetAll() => _sources.Value;

    private IReadOnlyCollection<ContentSource> LoadSources()
    {
        if (!File.Exists(_sourcePath))
        {
            _logger.LogError("Content source manifest not found at {Path}", _sourcePath);
            return Array.Empty<ContentSource>();
        }

        try
        {
            var json = File.ReadAllText(_sourcePath);
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var parsed = JsonSerializer.Deserialize<List<ContentSourceDto>>(json, options) ?? new List<ContentSourceDto>();
            return parsed
                .Where(p => !string.IsNullOrWhiteSpace(p.Id) && !string.IsNullOrWhiteSpace(p.Endpoint))
                .Select(Map)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read content sources from {Path}", _sourcePath);
            return Array.Empty<ContentSource>();
        }
    }

    private static ContentSource Map(ContentSourceDto dto)
    {
        var type = Enum.TryParse<ContentSourceType>(dto.Type, true, out var parsed)
            ? parsed
            : ContentSourceType.Web;

        return new ContentSource
        {
            Id = dto.Id ?? string.Empty,
            Name = dto.Name ?? dto.Id ?? "source",
            Type = type,
            Endpoint = dto.Endpoint ?? string.Empty,
            HealthCheckUrl = string.IsNullOrWhiteSpace(dto.HealthCheckUrl) ? dto.Endpoint ?? string.Empty : dto.HealthCheckUrl!,
            Languages = dto.Languages?.Where(l => !string.IsNullOrWhiteSpace(l)).Select(l => l!.Trim()).ToArray() ?? Array.Empty<string>(),
            Topics = dto.Topics?.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t!.Trim()).ToArray() ?? Array.Empty<string>(),
            GeoFocus = dto.GeoFocus ?? string.Empty,
            Reliability = dto.Reliability,
            UpdateFrequency = dto.UpdateFrequency ?? string.Empty,
            PolandFocus = dto.PolandFocus,
            HumorFriendly = dto.HumorFriendly,
            Tags = dto.Tags?.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t!.Trim()).ToArray() ?? Array.Empty<string>(),
            RateLimitNotes = dto.RateLimitNotes ?? string.Empty
        };
    }

    private sealed class ContentSourceDto
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? Type { get; set; }
        public string? Endpoint { get; set; }
        public string? HealthCheckUrl { get; set; }
        public List<string>? Languages { get; set; }
        public List<string>? Topics { get; set; }
        public string? GeoFocus { get; set; }
        public int Reliability { get; set; } = 3;
        public string? UpdateFrequency { get; set; }
        public bool PolandFocus { get; set; }
        public bool HumorFriendly { get; set; }
        public List<string>? Tags { get; set; }
        public string? RateLimitNotes { get; set; }
    }
}
