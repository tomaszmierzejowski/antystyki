using System.Collections.Generic;

namespace Antystics.Api.ContentGeneration;

public enum ContentSourceType
{
    Api,
    Rss,
    Web
}

/// <summary>
/// Expected rate at which a source produces candidates that pass the pre-screen
/// (explicit %/ratio in title+summary). Used to prioritise high-yield sources first and
/// to gate low-yield sources when the run target can already be met without them.
/// </summary>
public enum StatYield
{
    /// <summary>General news / portal homepages — rarely mention % in headlines.</summary>
    Low = 1,
    /// <summary>Mixed analytics/news — occasionally mentions statistics.</summary>
    Medium = 2,
    /// <summary>Finance/economy/stats feeds — frequently contains inflation %, GDP %, etc.</summary>
    High = 3
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
    /// <summary>Expected statistical content density — drives fetch order and gating.</summary>
    public StatYield StatYield { get; init; } = StatYield.Medium;
}
