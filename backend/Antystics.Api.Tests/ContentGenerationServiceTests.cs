using System;
using System.Collections.Generic;
using System.Linq;
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
            new ContentSource { Id = "rss-1", Name = "RSS 1", Type = ContentSourceType.Rss, Endpoint = "http://example.com", HealthCheckUrl = "http://example.com", PolandFocus = true },
            new ContentSource { Id = "rss-2", Name = "RSS 2", Type = ContentSourceType.Rss, Endpoint = "http://example.com", HealthCheckUrl = "http://example.com", PolandFocus = false }
        };

        var provider = new TestSourceProvider(sources);
        var health = new TestHealthChecker();
        var adapters = new List<IContentSourceAdapter> { new TestAdapter() };
        var service = new ContentGenerationService(adapters, provider, health, options, db, userManager, NullLogger<ContentGenerationService>.Instance);

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
            new ContentSource { Id = "rss-1", Name = "RSS 1", Type = ContentSourceType.Rss, Endpoint = "http://example.com", HealthCheckUrl = "http://example.com", PolandFocus = true }
        };

        var provider = new TestSourceProvider(sources);
        var health = new TestHealthChecker();
        var adapters = new List<IContentSourceAdapter> { new TestAdapter() };
        var service = new ContentGenerationService(adapters, provider, health, options, db, userManager, NullLogger<ContentGenerationService>.Instance);

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
                    HumorFriendly = true
                }
            };

            return Task.FromResult<IReadOnlyCollection<SourceItem>>(items);
        }
    }
}
