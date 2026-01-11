using System.Collections.Generic;

namespace Antystics.Api.ContentGeneration;

public enum ContentSourceType
{
    Api,
    Rss,
    Web
}

public sealed record ContentSource
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public ContentSourceType Type { get; init; }
    public string Endpoint { get; init; } = string.Empty;
    public string HealthCheckUrl { get; init; } = string.Empty;
    public IReadOnlyCollection<string> Languages { get; init; } = new List<string>();
    public IReadOnlyCollection<string> Topics { get; init; } = new List<string>();
    public string GeoFocus { get; init; } = string.Empty;
    public int Reliability { get; init; }
    public string UpdateFrequency { get; init; } = string.Empty;
    public bool PolandFocus { get; init; }
    public bool HumorFriendly { get; init; }
    public IReadOnlyCollection<string> Tags { get; init; } = new List<string>();
    public string RateLimitNotes { get; init; } = string.Empty;
}
