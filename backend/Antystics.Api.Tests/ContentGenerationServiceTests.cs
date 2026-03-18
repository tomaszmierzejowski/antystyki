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
