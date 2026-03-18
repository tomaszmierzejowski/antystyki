using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration;
using Antystics.Api.ContentGeneration.Adapters;
using Antystics.Api.ContentGeneration.Models;
using Antystics.Api.ContentGeneration.Services;
using Antystics.Core.Entities;
using Antystics.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace Antystics.Api.Tests;

public class ContentGenerationServiceTests
{
    [Fact]
    public async Task GenerateAsync_PersistsPendingDrafts()
    {
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 2,
            MaxStatistics = 2,
            MinAntystics = 1,
            MaxAntystics = 1
        });

        var sources = new[]
        {
            new ContentSource { Id = "rss-1", Name = "RSS 1", Type = ContentSourceType.Rss, Endpoint = "http://example.com", HealthCheckUrl = "http://example.com", PolandFocus = true, Reliability = 5 },
            new ContentSource { Id = "rss-2", Name = "RSS 2", Type = ContentSourceType.Rss, Endpoint = "http://example.com", HealthCheckUrl = "http://example.com", PolandFocus = false, Reliability = 5 }
        };

        var provider = new TestSourceProvider(sources);
        var health = new TestHealthChecker();
        var httpClientFactory = new TestHttpClientFactory();
        var openAiService = new TestOpenAiService();
        var adapters = new List<IContentSourceAdapter> { new TestAdapter() };
        var service = new ContentGenerationService(adapters, provider, health, httpClientFactory, options, db, userManager, NullLogger<ContentGenerationService>.Instance, openAiService);

        var result = await service.GenerateAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 2,
            TargetAntystics = 1
        }, CancellationToken.None);

        Assert.False(result.DryRun);
        Assert.Equal(2, db.Statistics.Count());
        Assert.Equal(1, db.Antistics.Count());
        Assert.All(db.Statistics, s => Assert.Equal(ModerationStatus.Pending, s.Status));
        Assert.All(db.Antistics, a => Assert.Equal(ModerationStatus.Pending, a.Status));
        Assert.All(db.Statistics, s => Assert.False(string.IsNullOrWhiteSpace(s.GenerationKey)));
        Assert.All(db.Statistics, s => Assert.False(string.IsNullOrWhiteSpace(s.ProvenanceData)));
        Assert.All(db.Antistics, a => Assert.NotNull(a.SourceStatisticId));
    }

    [Fact]
    public async Task GenerateAsync_DryRunDoesNotPersist()
    {
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 1,
            MaxStatistics = 1,
            MinAntystics = 1,
            MaxAntystics = 1
        });

        var sources = new[]
        {
            new ContentSource { Id = "rss-1", Name = "RSS 1", Type = ContentSourceType.Rss, Endpoint = "http://example.com", HealthCheckUrl = "http://example.com", PolandFocus = true, Reliability = 5 }
        };

        var provider = new TestSourceProvider(sources);
        var health = new TestHealthChecker();
        var httpClientFactory = new TestHttpClientFactory();
        var openAiService = new TestOpenAiService();
        var adapters = new List<IContentSourceAdapter> { new TestAdapter() };
        var service = new ContentGenerationService(adapters, provider, health, httpClientFactory, options, db, userManager, NullLogger<ContentGenerationService>.Instance, openAiService);

        var result = await service.GenerateAsync(new ContentGenerationRequest
        {
            DryRun = true,
            TargetStatistics = 1,
            TargetAntystics = 1
        }, CancellationToken.None);

        Assert.True(result.DryRun);
        Assert.Empty(db.Statistics);
        Assert.Empty(db.Antistics);
        Assert.Single(result.CreatedStatistics);
        Assert.Single(result.CreatedAntystics);
    }

    [Fact]
    public async Task GenerateAsync_FiltersUntrustedSources()
    {
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 1,
            MaxStatistics = 1,
            MinAntystics = 0,
            MaxAntystics = 0,
            EnforceTrustedSources = true,
            MinimumSourceReliability = 4
        });

        var sources = new[]
        {
            new ContentSource
            {
                Id = "low-trust-rss",
                Name = "Low Trust",
                Type = ContentSourceType.Rss,
                Endpoint = "http://example.com",
                HealthCheckUrl = "http://example.com",
                PolandFocus = true,
                Reliability = 2
            }
        };

        var provider = new TestSourceProvider(sources);
        var health = new TestHealthChecker();
        var httpClientFactory = new TestHttpClientFactory();
        var openAiService = new TestOpenAiService();
        var adapters = new List<IContentSourceAdapter> { new TestAdapter() };
        var service = new ContentGenerationService(adapters, provider, health, httpClientFactory, options, db, userManager, NullLogger<ContentGenerationService>.Instance, openAiService);

        var result = await service.GenerateAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 1,
            TargetAntystics = 0
        }, CancellationToken.None);

        Assert.Empty(result.CreatedStatistics);
        Assert.Contains("low-trust-rss", result.SourceFailures);
        Assert.Equal("failed_no_valid_data", result.Outcome);
    }

    [Fact]
    public async Task GenerateAsync_PreventsDuplicates_ForSameExecutionDay()
    {
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 1,
            MaxStatistics = 1,
            MinAntystics = 0,
            MaxAntystics = 0,
            DuplicateWindowDays = 30
        });

        var sources = new[]
        {
            new ContentSource { Id = "rss-1", Name = "RSS 1", Type = ContentSourceType.Rss, Endpoint = "http://example.com", HealthCheckUrl = "http://example.com", PolandFocus = true, Reliability = 5 }
        };

        var provider = new TestSourceProvider(sources);
        var health = new TestHealthChecker();
        var httpClientFactory = new TestHttpClientFactory();
        var openAiService = new TestOpenAiService();
        var adapters = new List<IContentSourceAdapter> { new TestAdapter() };
        var service = new ContentGenerationService(adapters, provider, health, httpClientFactory, options, db, userManager, NullLogger<ContentGenerationService>.Instance, openAiService);

        var runTime = DateTimeOffset.UtcNow;
        var first = await service.GenerateAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 1,
            TargetAntystics = 0,
            ExecutionTime = runTime
        }, CancellationToken.None);

        var second = await service.GenerateAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 1,
            TargetAntystics = 0,
            ExecutionTime = runTime
        }, CancellationToken.None);

        Assert.Single(first.CreatedStatistics);
        Assert.Empty(second.CreatedStatistics);
        Assert.NotEmpty(second.SkippedDuplicates);
    }

    [Fact]
    public async Task GenerateAsync_WritesChartPayloads_InSupportedSchema()
    {
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 1,
            MaxStatistics = 1,
            MinAntystics = 1,
            MaxAntystics = 1
        });

        var sources = new[]
        {
            new ContentSource { Id = "rss-1", Name = "RSS 1", Type = ContentSourceType.Rss, Endpoint = "http://example.com", HealthCheckUrl = "http://example.com", PolandFocus = true, Reliability = 5 }
        };

        var provider = new TestSourceProvider(sources);
        var health = new TestHealthChecker();
        var httpClientFactory = new TestHttpClientFactory();
        var openAiService = new TestOpenAiService();
        var adapters = new List<IContentSourceAdapter> { new TestAdapter() };
        var service = new ContentGenerationService(adapters, provider, health, httpClientFactory, options, db, userManager, NullLogger<ContentGenerationService>.Instance, openAiService);

        await service.GenerateAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 1,
            TargetAntystics = 1
        }, CancellationToken.None);

        var statistic = db.Statistics.Single();
        var antistic = db.Antistics.Single();

        using var statDoc = JsonDocument.Parse(statistic.ChartData!);
        Assert.True(statDoc.RootElement.TryGetProperty("chartSuggestion", out var suggestion));
        Assert.True(suggestion.TryGetProperty("type", out var typeNode));
        Assert.Contains(typeNode.GetString(), new[] { "pie", "bar", "line" });

        using var antDoc = JsonDocument.Parse(antistic.ChartData!);
        Assert.True(antDoc.RootElement.TryGetProperty("templateId", out var templateNode));
        Assert.Contains(templateNode.GetString(), new[] { "two-column-default", "single-chart", "text-focused", "comparison" });
    }

    [Fact]
    public async Task GenerateAsync_FetchCancellation_PropagatesOutOfService()
    {
        // Arrange: adapter that throws OperationCanceledException when a pre-canceled token is passed.
        // This simulates a run-timeout CTS firing while adapters are fetching sources.
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 1,
            MaxStatistics = 1,
            MinAntystics = 0,
            MaxAntystics = 0
        });

        var sources = new[]
        {
            new ContentSource
            {
                Id = "rss-cancel",
                Name = "Cancel RSS",
                Type = ContentSourceType.Rss,
                Endpoint = "http://example.com",
                HealthCheckUrl = "http://example.com",
                PolandFocus = true,
                Reliability = 5
            }
        };

        var provider = new TestSourceProvider(sources);
        var health = new TestHealthChecker();
        var httpClientFactory = new TestHttpClientFactory();
        var openAiService = new TestOpenAiService();
        var cancelAdapter = new CancelingAdapter();
        var adapters = new List<IContentSourceAdapter> { cancelAdapter };
        var service = new ContentGenerationService(adapters, provider, health, httpClientFactory, options, db, userManager, NullLogger<ContentGenerationService>.Instance, openAiService);

        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            service.GenerateAsync(new ContentGenerationRequest
            {
                DryRun = false,
                TargetStatistics = 1,
                TargetAntystics = 0
            }, cts.Token));

        Assert.Empty(db.Statistics);
    }

    // ── Pre-screen pattern expansion ─────────────────────────────────────────

    [Theory]
    [InlineData("1 na 3 Polaków nie oszczędza")]              // Polish ratio "N na N"
    [InlineData("Ceny wzrosły dwukrotnie w ubiegłym roku")]   // multiplier phrase
    [InlineData("PKB wzrósł o 3 punkty w Q1")]                // quantified growth
    [InlineData("co czwarty pracownik pracuje zdalnie")]       // "co N-ty" fraction
    [InlineData("jedna trzecia respondentów wskazała brak")]  // natural-language fraction
    [InlineData("połowa Polaków deklaruje brak oszczędności")]// "połowa Polaków"
    public async Task GenerateAsync_NewPrescreenPatterns_ProduceValidStatistic(string titleWithPattern)
    {
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 1,
            MaxStatistics = 1,
            MinAntystics = 0,
            MaxAntystics = 0
        });

        var sources = new[]
        {
            new ContentSource
            {
                Id = "rss-test",
                Name = "RSS Test",
                Type = ContentSourceType.Rss,
                Endpoint = "http://example.com",
                HealthCheckUrl = "http://example.com",
                PolandFocus = true,
                Reliability = 5,
                StatYield = StatYield.High
            }
        };

        var adapter = new FixedTitleAdapter(titleWithPattern);
        var service = new ContentGenerationService(
            new[] { adapter },
            new TestSourceProvider(sources),
            new TestHealthChecker(),
            new TestHttpClientFactory(),
            options,
            db,
            userManager,
            NullLogger<ContentGenerationService>.Instance,
            new TestOpenAiService());

        var result = await service.GenerateAsync(
            new ContentGenerationRequest { DryRun = true, TargetStatistics = 1, TargetAntystics = 0 },
            CancellationToken.None);

        Assert.NotEmpty(result.CreatedStatistics);
        var noValidDataFailure = result.ValidationIssues.Any(i =>
            i.Reason.StartsWith("Pre-screen", StringComparison.OrdinalIgnoreCase));
        Assert.False(noValidDataFailure,
            $"Title '{titleWithPattern}' should pass pre-screen but was rejected. Issues: {string.Join("; ", result.ValidationIssues.Select(i => i.Reason))}");
    }

    [Fact]
    public async Task GenerateAsync_NoPrescreenSignal_AllItemsRejectedWithPrescreenReason()
    {
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 1,
            MaxStatistics = 1,
            MinAntystics = 0,
            MaxAntystics = 0
        });

        var sources = new[]
        {
            new ContentSource
            {
                Id = "rss-test",
                Name = "RSS Test",
                Type = ContentSourceType.Rss,
                Endpoint = "http://example.com",
                HealthCheckUrl = "http://example.com",
                PolandFocus = true,
                Reliability = 5
            }
        };

        // Pure event title — no % or ratio signal anywhere.
        var adapter = new FixedTitleAdapter("Rząd zatwierdził nowe przepisy budowlane");
        var service = new ContentGenerationService(
            new[] { adapter },
            new TestSourceProvider(sources),
            new TestHealthChecker(),
            new TestHttpClientFactory(),
            options,
            db,
            userManager,
            NullLogger<ContentGenerationService>.Instance,
            new TestOpenAiService());

        var result = await service.GenerateAsync(
            new ContentGenerationRequest { DryRun = false, TargetStatistics = 1, TargetAntystics = 0 },
            CancellationToken.None);

        Assert.Equal("failed_no_valid_data", result.Outcome);
        Assert.All(result.ValidationIssues,
            i => Assert.StartsWith("Pre-screen", i.Reason, StringComparison.OrdinalIgnoreCase));
    }

    // ── Low-yield gating ──────────────────────────────────────────────────────

    [Fact]
    public async Task GenerateAsync_LowYieldGating_SkipsLowSourceOnceThresholdMet()
    {
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 1,
            MaxStatistics = 1,
            MinAntystics = 0,
            MaxAntystics = 0,
            LowYieldGatingEnabled = true,
            LowYieldSkipThreshold = 1   // gate Low if ≥1 item already fetched from High/Medium
        });

        // High-yield source comes first alphabetically but StatYield ordering puts it first.
        var sources = new[]
        {
            new ContentSource
            {
                Id = "high-src",
                Name = "High Yield",
                Type = ContentSourceType.Rss,
                Endpoint = "http://high.example.com",
                HealthCheckUrl = "http://high.example.com",
                PolandFocus = true,
                Reliability = 5,
                StatYield = StatYield.High
            },
            new ContentSource
            {
                Id = "low-src",
                Name = "Low Yield",
                Type = ContentSourceType.Rss,
                Endpoint = "http://low.example.com",
                HealthCheckUrl = "http://low.example.com",
                PolandFocus = true,
                Reliability = 5,
                StatYield = StatYield.Low
            }
        };

        // Spy adapter: throws if the low-yield source is fetched — proves gating blocked it.
        var spyAdapter = new SpyFetchAdapter();
        var service = new ContentGenerationService(
            new[] { spyAdapter },
            new TestSourceProvider(sources),
            new TestHealthChecker(),
            new TestHttpClientFactory(),
            options,
            db,
            userManager,
            NullLogger<ContentGenerationService>.Instance,
            new TestOpenAiService());

        var result = await service.GenerateAsync(
            new ContentGenerationRequest { DryRun = true, TargetStatistics = 1, TargetAntystics = 0 },
            CancellationToken.None);

        // The high-yield source must have been fetched.
        Assert.Contains("high-src", spyAdapter.FetchedSourceIds);
        // The low-yield source must have been gated (not fetched).
        Assert.DoesNotContain("low-src", spyAdapter.FetchedSourceIds);
        // Skipped sources JSON should reference the low-yield source.
        Assert.NotNull(result.SkippedSourcesJson);
        Assert.Contains("low-src", result.SkippedSourcesJson, StringComparison.OrdinalIgnoreCase);
    }

    // ── Source performance JSON ───────────────────────────────────────────────

    [Fact]
    public async Task GenerateAsync_SourcePerformanceJson_PopulatedAfterRun()
    {
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 1,
            MaxStatistics = 1,
            MinAntystics = 0,
            MaxAntystics = 0
        });

        var sources = new[]
        {
            new ContentSource
            {
                Id = "perf-src",
                Name = "Perf Source",
                Type = ContentSourceType.Rss,
                Endpoint = "http://example.com",
                HealthCheckUrl = "http://example.com",
                PolandFocus = true,
                Reliability = 5,
                StatYield = StatYield.High
            }
        };

        var service = new ContentGenerationService(
            new[] { new TestAdapter() },
            new TestSourceProvider(sources),
            new TestHealthChecker(),
            new TestHttpClientFactory(),
            options,
            db,
            userManager,
            NullLogger<ContentGenerationService>.Instance,
            new TestOpenAiService());

        var result = await service.GenerateAsync(
            new ContentGenerationRequest { DryRun = true, TargetStatistics = 1, TargetAntystics = 0 },
            CancellationToken.None);

        Assert.NotNull(result.SourcePerformanceJson);
        Assert.NotEmpty(result.SourcePerformanceJson);

        // The JSON must contain the source ID.
        using var doc = JsonDocument.Parse(result.SourcePerformanceJson);
        var root = doc.RootElement;
        Assert.Equal(JsonValueKind.Array, root.ValueKind);
        Assert.True(root.GetArrayLength() > 0, "SourcePerformanceJson array should not be empty after a run with fetched items.");
        var entry = root.EnumerateArray().First();
        Assert.Equal("perf-src", entry.GetProperty("id").GetString());
        Assert.True(entry.GetProperty("fetched").GetInt32() > 0);
    }

    [Fact]
    public async Task GenerateAsync_EmptyFetch_DoesNotRetryWithBackoff_CompletesQuickly()
    {
        // Arrange: adapter that always returns empty — should not spend time on backoff retries.
        var services = BuildServices();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();
        using var scope = scopeFactory.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        var options = Options.Create(new ContentGenerationOptions
        {
            MinStatistics = 1,
            MaxStatistics = 1,
            MinAntystics = 0,
            MaxAntystics = 0,
            SourceFetchMaxAttempts = 3,
            RetryBaseDelaySeconds = 10 // Large delay — would inflate time if retried on empty
        });

        var sources = new[]
        {
            new ContentSource
            {
                Id = "rss-empty",
                Name = "Empty RSS",
                Type = ContentSourceType.Rss,
                Endpoint = "http://example.com",
                HealthCheckUrl = "http://example.com",
                PolandFocus = true,
                Reliability = 5
            }
        };

        var provider = new TestSourceProvider(sources);
        var health = new TestHealthChecker();
        var httpClientFactory = new TestHttpClientFactory();
        var openAiService = new TestOpenAiService();
        var adapters = new List<IContentSourceAdapter> { new EmptyAdapter() };
        var service = new ContentGenerationService(adapters, provider, health, httpClientFactory, options, db, userManager, NullLogger<ContentGenerationService>.Instance, openAiService);

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = await service.GenerateAsync(new ContentGenerationRequest
        {
            DryRun = false,
            TargetStatistics = 1,
            TargetAntystics = 0
        }, CancellationToken.None);
        sw.Stop();

        Assert.Empty(result.CreatedStatistics);
        // Must complete well under even one retry delay (10 s), proving empty fetch is not retried.
        Assert.True(sw.Elapsed.TotalSeconds < 5,
            $"Elapsed {sw.Elapsed.TotalSeconds:F1} s — empty fetch should not trigger retry backoff.");
    }

    private static ServiceProvider BuildServices()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
        services.AddIdentityCore<User>()
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<ApplicationDbContext>();
        return services.BuildServiceProvider();
    }

    private sealed class TestSourceProvider : IContentSourceProvider
    {
        private readonly IReadOnlyCollection<ContentSource> _sources;

        public TestSourceProvider(IReadOnlyCollection<ContentSource> sources)
        {
            _sources = sources;
        }

        public IReadOnlyCollection<ContentSource> GetAll() => _sources;
    }

    private sealed class TestHealthChecker : ISourceHealthChecker
    {
        public Task<bool> IsHealthyAsync(ContentSource source, TimeSpan timeout, CancellationToken cancellationToken) => Task.FromResult(true);
    }

    private sealed class TestAdapter : IContentSourceAdapter
    {
        public bool CanHandle(ContentSourceType type) => true;

        public Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken)
        {
            var items = new List<SourceItem>
            {
                new()
                {
                    SourceId = source.Id,
                    SourceName = source.Name,
                    Title = $"Title {source.Id} 42%",
                    Summary = $"Summary {source.Id}",
                    SourceUrl = $"http://example.com/{source.Id}",
                    PublishedAt = DateTimeOffset.UtcNow,
                    PolandFocus = source.PolandFocus,
                    HumorFriendly = true,
                    Topics = new[] { "economy" }
                }
            };

            return Task.FromResult<IReadOnlyCollection<SourceItem>>(items);
        }
    }

    private sealed class CancelingAdapter : IContentSourceAdapter
    {
        public bool CanHandle(ContentSourceType type) => true;

        public Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return Task.FromResult<IReadOnlyCollection<SourceItem>>(Array.Empty<SourceItem>());
        }
    }

    private sealed class EmptyAdapter : IContentSourceAdapter
    {
        public bool CanHandle(ContentSourceType type) => true;

        public Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyCollection<SourceItem>>(Array.Empty<SourceItem>());
    }

    /// <summary>Returns one item per source using the specified title (allows testing pre-screen patterns).</summary>
    private sealed class FixedTitleAdapter : IContentSourceAdapter
    {
        private readonly string _title;
        public FixedTitleAdapter(string title) { _title = title; }
        public bool CanHandle(ContentSourceType type) => true;

        public Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken)
        {
            IReadOnlyCollection<SourceItem> items = new[]
            {
                new SourceItem
                {
                    SourceId = source.Id,
                    SourceName = source.Name,
                    Title = _title,
                    Summary = _title,
                    SourceUrl = $"http://example.com/{source.Id}",
                    PublishedAt = DateTimeOffset.UtcNow,
                    PolandFocus = source.PolandFocus,
                    HumorFriendly = true,
                    Topics = new[] { "economy" }
                }
            };
            return Task.FromResult(items);
        }
    }

    /// <summary>Records which source IDs were fetched; used to assert gating behaviour.</summary>
    private sealed class SpyFetchAdapter : IContentSourceAdapter
    {
        public List<string> FetchedSourceIds { get; } = new();
        public bool CanHandle(ContentSourceType type) => true;

        public Task<IReadOnlyCollection<SourceItem>> FetchAsync(ContentSource source, CancellationToken cancellationToken)
        {
            FetchedSourceIds.Add(source.Id);
            IReadOnlyCollection<SourceItem> items = new[]
            {
                new SourceItem
                {
                    SourceId = source.Id,
                    SourceName = source.Name,
                    Title = $"Inflacja wzrosła o 5 proc. w 2024 roku — {source.Id}",
                    Summary = "Dane makroekonomiczne wskazują na wzrost o 5%.",
                    SourceUrl = $"http://example.com/{source.Id}",
                    PublishedAt = DateTimeOffset.UtcNow,
                    PolandFocus = source.PolandFocus,
                    HumorFriendly = true,
                    Topics = new[] { "economy" }
                }
            };
            return Task.FromResult(items);
        }
    }

    private sealed class TestHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name)
        {
            var handler = new TestHttpMessageHandler();
            return new HttpClient(handler);
        }
    }

    private sealed class TestHttpMessageHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK));
        }
    }

    private sealed class TestOpenAiService : IOpenAiService
    {
        public Task<LlmGenerationResult?> AnalyzeAndGenerateAsync(SourceItem item, CancellationToken cancellationToken)
        {
            return Task.FromResult<LlmGenerationResult?>(new LlmGenerationResult
            {
                IsValid = true,
                PercentageValue = 42,
                ContextSentence = "Test context",
                Timeframe = "2024",
                ReversedStatistic = "Ironia na 42%!",
                Confidence = 0.95,
                ChartType = "pie",
                ChartLabelMain = "Główna wartość",
                ChartLabelSecondary = "Pozostałe"
            });
        }
    }
}
