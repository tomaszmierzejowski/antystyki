using System.IO;
using Antystics.Api.ContentGeneration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.FileProviders;
using Xunit;

namespace Antystics.Api.Tests;

public class ContentSourceProviderTests
{
    [Fact]
    public void LoadsSourcesFromManifest()
    {
        var manifestPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Antystics.Api", "ContentGeneration", "content-sources.json"));
        var options = Options.Create(new ContentGenerationOptions
        {
            SourcesPath = manifestPath
        });

        var env = new FakeHostEnvironment
        {
            ContentRootPath = Directory.GetCurrentDirectory()
        };

        var provider = new ContentSourceProvider(options, env, NullLogger<ContentSourceProvider>.Instance);

        var sources = provider.GetAll();

        Assert.NotEmpty(sources);
        Assert.Contains(sources, s => s.Id == "pap-rss");
        Assert.Contains(sources, s => s.Type == ContentSourceType.Api);
    }

    private sealed class FakeHostEnvironment : IHostEnvironment
    {
        public string ApplicationName { get; set; } = "Tests";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = string.Empty;
        public string EnvironmentName { get; set; } = "Development";
    }
}
