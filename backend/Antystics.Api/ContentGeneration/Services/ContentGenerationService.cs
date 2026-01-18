using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Adapters;
using Antystics.Api.ContentGeneration.Models;
using Antystics.Core.Entities;
using Antystics.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Antystics.Api.ContentGeneration.Services;

public interface IContentGenerationService
{
    Task<ContentGenerationResult> GenerateAsync(ContentGenerationRequest request, CancellationToken cancellationToken);
}

internal sealed class ContentGenerationService : IContentGenerationService
{
    private readonly IEnumerable<IContentSourceAdapter> _adapters;
    private readonly IContentSourceProvider _sourceProvider;
    private readonly ISourceHealthChecker _healthChecker;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ContentGenerationOptions _options;
    private readonly ApplicationDbContext _dbContext;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<ContentGenerationService> _logger;
    private static readonly Regex NumberRegex = new(@"(\d+[.,]?\d*\%?)", RegexOptions.Compiled);
    private static readonly Regex PercentageRegex = new(@"(?<!\d)(\d{1,3}(?:[.,]\d+)?)[ ]?%", RegexOptions.Compiled);
    private static readonly Regex RatioRegex = new(@"(?<!\d)(\d{1,3}(?:[.,]\d+)?)[ ]*/[ ]*(\d{1,3}(?:[.,]\d+)?)", RegexOptions.Compiled);
    private static readonly Regex YearRegex = new(@"\b(20\d{2})\b", RegexOptions.Compiled);
    private const int TitleMaxLength = 280;
    private const int SummaryMaxLength = 2000;
    private const string DefaultImageUrl = "/placeholder.png";

    public ContentGenerationService(
        IEnumerable<IContentSourceAdapter> adapters,
        IContentSourceProvider sourceProvider,
        ISourceHealthChecker healthChecker,
        IHttpClientFactory httpClientFactory,
        IOptions<ContentGenerationOptions> options,
        ApplicationDbContext dbContext,
        UserManager<User> userManager,
        ILogger<ContentGenerationService> logger)
    {
        _adapters = adapters;
        _sourceProvider = sourceProvider;
        _healthChecker = healthChecker;
        _httpClientFactory = httpClientFactory;
        _dbContext = dbContext;
        _userManager = userManager;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<ContentGenerationResult> GenerateAsync(ContentGenerationRequest request, CancellationToken cancellationToken)
    {
        var executionTime = request.ExecutionTime ?? DateTimeOffset.UtcNow;
        var utcNow = executionTime.UtcDateTime;

        var sources = FilterSources(request.SourceIds);
        var healthySources = await ValidateSourcesAsync(sources, cancellationToken).ConfigureAwait(false);
        var candidateItems = await FetchCandidatesAsync(healthySources.HealthySources, cancellationToken).ConfigureAwait(false);
        candidateItems = candidateItems
            .Select(SanitizeItem)
            .Where(i => i != null)
            .Cast<SourceItem>()
            .ToList();

        var validation = await ValidateItemsAsync(candidateItems, utcNow, cancellationToken).ConfigureAwait(false);
        var validatedItems = validation.ValidItems;

        if (validatedItems.Count == 0)
        {
            return new ContentGenerationResult
            {
                CreatedAntystics = Array.Empty<GeneratedDraft>(),
                CreatedStatistics = Array.Empty<GeneratedDraft>(),
                ExecutedAt = executionTime,
                DryRun = request.DryRun,
                ValidationFailures = validation.Issues.Select(v => v.Reason).Distinct().ToList(),
                SourceFailures = healthySources.UnhealthyIds,
                ValidationIssues = validation.Issues
            };
        }

        var targetStats = Clamp(request.TargetStatistics, _options.MinStatistics, _options.MaxStatistics);
        var targetAntystics = Clamp(request.TargetAntystics, _options.MinAntystics, _options.MaxAntystics);

        var duplicates = await LoadRecentDuplicateKeysAsync(utcNow, cancellationToken).ConfigureAwait(false);
        var filtered = FilterDuplicates(validatedItems, duplicates);

        var selectedStatistics = SelectStatistics(filtered, targetStats);
        var selectedAntystics = SelectAntystics(selectedStatistics, targetAntystics);

        if (request.DryRun)
        {
            return BuildResult(
                executionTime,
                selectedStatistics,
                selectedAntystics,
                Array.Empty<Guid>(),
                Array.Empty<Guid>(),
                healthySources.UnhealthyIds,
                filtered.SkippedKeys,
                validation.Issues,
                true);
        }

        var systemUserId = await EnsureSystemUserAsync(cancellationToken).ConfigureAwait(false);
        var createdStatisticIds = new List<Guid>();
        var createdAntysticIds = new List<Guid>();

        foreach (var stat in selectedStatistics)
        {
            var entity = MapToStatistic(stat, systemUserId, utcNow);
            _dbContext.Statistics.Add(entity);
            createdStatisticIds.Add(entity.Id);
        }

        foreach (var antystyk in selectedAntystics)
        {
            var entity = MapToAntystic(antystyk, systemUserId, utcNow);
            _dbContext.Antistics.Add(entity);
            createdAntysticIds.Add(entity.Id);
        }

        await _dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return BuildResult(
            executionTime,
            selectedStatistics,
            selectedAntystics,
            createdStatisticIds,
            createdAntysticIds,
            healthySources.UnhealthyIds,
            filtered.SkippedKeys,
            validation.Issues,
            false);
    }

    private SourceItem? SanitizeItem(SourceItem item)
    {
        if (item is null)
        {
            return null;
        }

        var cleanedTitle = ContentSanitizer.CleanText(item.Title, 180);
        var cleanedSummary = ContentSanitizer.CleanText(item.Summary, 400);

        if (string.IsNullOrWhiteSpace(cleanedTitle) || ContentSanitizer.HasHtmlNoise(cleanedTitle) || ContentSanitizer.HasHtmlNoise(cleanedSummary))
        {
            return null;
        }

        return item with
        {
            Title = cleanedTitle,
            Summary = string.IsNullOrWhiteSpace(cleanedSummary) ? cleanedTitle : cleanedSummary,
            SourceUrl = item.SourceUrl?.Trim() ?? string.Empty
        };
    }

    private async Task<(IReadOnlyCollection<SourceItem> ValidItems, IReadOnlyCollection<ValidationIssue> Issues)> ValidateItemsAsync(
        IReadOnlyCollection<SourceItem> items,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var valid = new List<SourceItem>();
        var issues = new List<ValidationIssue>();
        var sourceStatusCache = new Dictionary<string, int?>(StringComparer.OrdinalIgnoreCase);

        foreach (var item in items)
        {
            var metric = ExtractMetric($"{item.Title} {item.Summary}");
            if (metric.PercentageValue is null)
            {
                issues.Add(BuildIssue(item, "Missing percentage or ratio convertible to percentage.", metric, null));
                continue;
            }

            if (item.PublishedAt.HasValue && item.PublishedAt.Value.UtcDateTime < utcNow.AddDays(-14))
            {
                issues.Add(BuildIssue(item, "Stale item (older than 14 days).", metric, null));
                continue;
            }

            var statusCode = await GetSourceStatusCodeAsync(item.SourceUrl, sourceStatusCache, cancellationToken).ConfigureAwait(false);
            if (statusCode != 200)
            {
                issues.Add(BuildIssue(item, "Source URL did not return HTTP 200.", metric, statusCode));
                continue;
            }

            var timeframe = BuildTimeframe(item);
            var context = ExtractContextSentence(item);
            var numericStatement = BuildNumericStatement(metric.PercentageValue.Value, context, timeframe);

            valid.Add(item with
            {
                PercentageValue = metric.PercentageValue,
                Ratio = metric.Ratio,
                Timeframe = timeframe,
                ContextSentence = context,
                NumericStatement = numericStatement,
                Publisher = item.Publisher ?? item.SourceName,
                SourceStatusCode = statusCode
            });
        }

        return (valid, issues);
    }

    private static ValidationIssue BuildIssue(SourceItem item, string reason, MetricExtraction metric, int? statusCode)
    {
        return new ValidationIssue
        {
            SourceId = item.SourceId,
            SourceName = item.SourceName,
            Title = item.Title,
            Reason = reason,
            SourceUrl = item.SourceUrl,
            SourceStatusCode = statusCode,
            PercentageValue = metric.PercentageValue,
            Ratio = metric.Ratio,
            Timeframe = item.PublishedAt?.ToString("yyyy-MM-dd"),
            ContextSentence = ExtractContextSentence(item)
        };
    }

    private async Task<int?> GetSourceStatusCodeAsync(
        string sourceUrl,
        IDictionary<string, int?> cache,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sourceUrl))
        {
            return null;
        }

        if (cache.TryGetValue(sourceUrl, out var cached))
        {
            return cached;
        }

        var client = _httpClientFactory.CreateClient("content-generation");
        try
        {
            using var response = await client.GetAsync(sourceUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);
            var statusCode = (int)response.StatusCode;
            cache[sourceUrl] = statusCode;
            return statusCode;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Source URL check failed for {Url}", sourceUrl);
            cache[sourceUrl] = null;
            return null;
        }
    }

    private static MetricExtraction ExtractMetric(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new MetricExtraction(null, null);
        }

        var percentMatch = PercentageRegex.Match(text);
        if (percentMatch.Success && double.TryParse(NormalizeNumber(percentMatch.Groups[1].Value), out var percentValue))
        {
            return new MetricExtraction(percentValue, null);
        }

        var ratioMatch = RatioRegex.Match(text);
        if (ratioMatch.Success &&
            double.TryParse(NormalizeNumber(ratioMatch.Groups[1].Value), out var numerator) &&
            double.TryParse(NormalizeNumber(ratioMatch.Groups[2].Value), out var denominator) &&
            denominator > 0 &&
            numerator <= 1000 &&
            denominator <= 1000)
        {
            var percentage = (numerator / denominator) * 100;
            var ratio = $"{ratioMatch.Groups[1].Value}/{ratioMatch.Groups[2].Value}";
            return new MetricExtraction(percentage, ratio);
        }

        return new MetricExtraction(null, null);
    }

    private static string NormalizeNumber(string value)
    {
        return value.Replace(',', '.');
    }

    private static string BuildTimeframe(SourceItem item)
    {
        if (item.PublishedAt.HasValue)
        {
            return item.PublishedAt.Value.ToString("yyyy-MM-dd");
        }

        var candidate = $"{item.Title} {item.Summary}";
        var yearMatch = YearRegex.Match(candidate);
        return yearMatch.Success ? yearMatch.Groups[1].Value : "latest available";
    }

    private static string ExtractContextSentence(SourceItem item)
    {
        var source = string.IsNullOrWhiteSpace(item.Summary) ? item.Title : item.Summary;
        if (string.IsNullOrWhiteSpace(source))
        {
            return "the measured group";
        }

        var splitIndex = source.IndexOf('.');
        var sentence = splitIndex > 0 ? source[..splitIndex] : source;
        return sentence.Trim();
    }

    private static string BuildNumericStatement(double percentage, string context, string timeframe)
    {
        var cleanedContext = PercentageRegex.Replace(context, string.Empty);
        cleanedContext = RatioRegex.Replace(cleanedContext, string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(cleanedContext))
        {
            cleanedContext = context;
        }

        return $"{percentage:0.#}% {cleanedContext} ({timeframe})";
    }

    private IReadOnlyCollection<ContentSource> FilterSources(IReadOnlyCollection<string>? sourceIds)
    {
        var sources = _sourceProvider.GetAll();

        var enabledIds = _options.EnabledSourceIds?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase) ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var requestIds = sourceIds?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase) ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (enabledIds.Count == 0 && requestIds.Count == 0)
        {
            return sources;
        }

        var filterSet = requestIds.Count > 0 ? requestIds : enabledIds;
        return sources.Where(s => filterSet.Contains(s.Id)).ToList();
    }

    private async Task<(IReadOnlyCollection<string> UnhealthyIds, IReadOnlyCollection<ContentSource> HealthySources)> ValidateSourcesAsync(
        IReadOnlyCollection<ContentSource> sources,
        CancellationToken cancellationToken)
    {
        var unhealthy = new List<string>();
        var healthy = new List<ContentSource>();
        var timeout = TimeSpan.FromSeconds(Math.Max(4, _options.HttpTimeoutSeconds));

        foreach (var source in sources)
        {
            var ok = await _healthChecker.IsHealthyAsync(source, timeout, cancellationToken).ConfigureAwait(false);
            if (ok)
            {
                healthy.Add(source);
            }
            else
            {
                unhealthy.Add(source.Id);
            }
        }

        return (unhealthy, healthy);
    }

    private async Task<IReadOnlyCollection<SourceItem>> FetchCandidatesAsync(
        IReadOnlyCollection<ContentSource> sources,
        CancellationToken cancellationToken)
    {
        var items = new List<SourceItem>();
        foreach (var source in sources)
        {
            var adapter = _adapters.FirstOrDefault(a => a.CanHandle(source.Type));
            if (adapter is null)
            {
                _logger.LogWarning("No adapter found for source type {Type} ({Id})", source.Type, source.Id);
                continue;
            }

            var fetched = await adapter.FetchAsync(source, cancellationToken).ConfigureAwait(false);
            if (fetched.Count == 0)
            {
                continue;
            }

            items.AddRange(fetched);
        }

        return items;
    }

    private static int Clamp(int? requested, int min, int max)
    {
        if (!requested.HasValue)
        {
            return max;
        }

        var value = requested.Value;
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    private async Task<DuplicateSnapshot> LoadRecentDuplicateKeysAsync(DateTime utcNow, CancellationToken cancellationToken)
    {
        var windowStart = utcNow.AddDays(-Math.Max(1, _options.DuplicateWindowDays));
        var recentStatisticTitles = await _dbContext.Statistics
            .Where(s => s.CreatedAt >= windowStart)
            .Select(s => new { s.Title, s.SourceUrl })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var recentAntysticTitles = await _dbContext.Antistics
            .Where(a => a.CreatedAt >= windowStart)
            .Select(a => new { a.Title, a.SourceUrl })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var titleSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var urlSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in recentStatisticTitles)
        {
            if (!string.IsNullOrWhiteSpace(row.Title))
            {
                titleSet.Add(row.Title.Trim());
            }

            if (!string.IsNullOrWhiteSpace(row.SourceUrl))
            {
                urlSet.Add(row.SourceUrl.Trim());
            }
        }

        foreach (var row in recentAntysticTitles)
        {
            if (!string.IsNullOrWhiteSpace(row.Title))
            {
                titleSet.Add(row.Title.Trim());
            }

            if (!string.IsNullOrWhiteSpace(row.SourceUrl))
            {
                urlSet.Add(row.SourceUrl.Trim());
            }
        }

        return new DuplicateSnapshot(titleSet, urlSet);
    }

    private FilteredItems FilterDuplicates(IReadOnlyCollection<SourceItem> items, DuplicateSnapshot duplicates)
    {
        var skipped = new List<string>();
        var filtered = new List<SourceItem>();

        foreach (var item in items)
        {
            var titleKey = item.Title.Trim();
            var urlKey = item.SourceUrl.Trim();

            if (duplicates.TitleKeys.Contains(titleKey) || duplicates.UrlKeys.Contains(urlKey))
            {
                skipped.Add(titleKey);
                continue;
            }

            if (filtered.Any(f => f.Title.Equals(titleKey, StringComparison.OrdinalIgnoreCase) || f.SourceUrl.Equals(urlKey, StringComparison.OrdinalIgnoreCase)))
            {
                skipped.Add(titleKey);
                continue;
            }

            filtered.Add(item);
        }

        return new FilteredItems(filtered, skipped);
    }

    private IReadOnlyCollection<SourceItem> SelectStatistics(FilteredItems items, int target)
    {
        var desiredPoland = (int)Math.Ceiling(target * _options.PolandRatioFloor);
        var polandItems = items.Items.Where(i => i.PolandFocus).Take(desiredPoland).ToList();
        var remaining = items.Items.Where(i => !polandItems.Contains(i)).ToList();

        var orderedRemaining = remaining
            .OrderByDescending(i => i.PublishedAt ?? DateTimeOffset.MinValue)
            .ThenBy(i => i.SourceId)
            .ToList();

        var selected = new List<SourceItem>();
        selected.AddRange(polandItems.Take(target));

        foreach (var item in orderedRemaining)
        {
            if (selected.Count >= target)
            {
                break;
            }
            selected.Add(item);
        }

        return selected;
    }

    private IReadOnlyCollection<SourceItem> SelectAntystics(IReadOnlyCollection<SourceItem> statistics, int target)
    {
        return statistics
            .Where(s => s.HumorFriendly || s.PolandFocus)
            .Take(target)
            .ToList();
    }

    private async Task<Guid> EnsureSystemUserAsync(CancellationToken cancellationToken)
    {
        var email = _options.CreatorEmail.Trim();
        var existing = await _userManager.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken).ConfigureAwait(false);
        if (existing != null)
        {
            return existing.Id;
        }

        var user = new User
        {
            Email = email,
            UserName = email,
            EmailConfirmed = true,
            Role = UserRole.Admin,
            Provider = "system",
            ProviderUserId = null
        };

        var password = $"Auto_{Guid.NewGuid():N}!Aa1";
        var result = await _userManager.CreateAsync(user, password).ConfigureAwait(false);
        if (!result.Succeeded)
        {
            var message = string.Join("; ", result.Errors.Select(e => e.Description));
            _logger.LogError("Failed to create system user {Email}: {Message}", email, message);
            throw new InvalidOperationException($"Cannot create system user: {message}");
        }

        return user.Id;
    }

    private Statistic MapToStatistic(SourceItem item, Guid userId, DateTime utcNow)
    {
        var sourceCitation = $"{item.SourceName} ({(item.PublishedAt?.ToString("yyyy-MM-dd") ?? utcNow.ToString("yyyy-MM-dd"))})";
        var chartData = JsonSerializer.Serialize(new
        {
            autoGen = new
            {
                percentageValue = item.PercentageValue,
                ratio = item.Ratio,
                timeframe = item.Timeframe,
                contextSentence = item.ContextSentence,
                publisher = item.Publisher,
                sourceStatusCode = item.SourceStatusCode,
                geoFocus = item.GeoFocus,
                topics = item.Topics,
                tags = item.Tags,
                sourceId = item.SourceId,
                sourceName = item.SourceName
            }
        });

        return new Statistic
        {
            Id = Guid.NewGuid(),
            Title = Trim(item.Title, TitleMaxLength),
            Summary = Trim(BuildStatisticSummary(item), SummaryMaxLength),
            Description = Trim(item.Summary, SummaryMaxLength),
            SourceUrl = item.SourceUrl,
            SourceCitation = sourceCitation,
            ChartData = chartData,
            Status = ModerationStatus.Pending,
            CreatedAt = utcNow,
            CreatedByUserId = userId
        };
    }

    private Antistic MapToAntystic(SourceItem item, Guid userId, DateTime utcNow)
    {
        var turned = BuildAntysticText(item);
        var chartData = JsonSerializer.Serialize(new
        {
            autoGen = new
            {
                percentageValue = item.PercentageValue,
                ratio = item.Ratio,
                timeframe = item.Timeframe,
                contextSentence = item.ContextSentence,
                publisher = item.Publisher,
                sourceStatusCode = item.SourceStatusCode,
                geoFocus = item.GeoFocus,
                topics = item.Topics,
                tags = item.Tags,
                sourceId = item.SourceId,
                sourceName = item.SourceName
            }
        });

        return new Antistic
        {
            Id = Guid.NewGuid(),
            Title = Trim(item.Title, TitleMaxLength),
            ReversedStatistic = Trim(turned, SummaryMaxLength),
            SourceUrl = item.SourceUrl,
            ImageUrl = DefaultImageUrl,
            TemplateId = "auto",
            ChartData = chartData,
            Status = ModerationStatus.Pending,
            CreatedAt = utcNow,
            UserId = userId
        };
    }

    private static string BuildStatisticSummary(SourceItem item)
    {
        if (!string.IsNullOrWhiteSpace(item.NumericStatement))
        {
            return item.NumericStatement.Trim();
        }

        if (!string.IsNullOrWhiteSpace(item.Summary))
        {
            return item.Summary.Trim();
        }

        return item.Title.Length > 0
            ? item.Title.Trim()
            : "Statystyka z automatycznego źródła (brak szczegółowego opisu).";
    }

    private string BuildAntysticText(SourceItem item)
    {
        var setup = item.NumericStatement ?? Trim(item.Title, 160);
        var percentText = item.PercentageValue.HasValue ? $"{item.PercentageValue:0.#}%" : "Ten odsetek";
        var turn = $"Jeśli {percentText} to nowa norma, ironia już szykuje ripostę.";

        return Trim($"{setup} — {turn}", SummaryMaxLength);
    }

    private static string? ExtractNumber(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var match = NumberRegex.Match(value);
        return match.Success ? match.Value : null;
    }

    private ContentGenerationResult BuildResult(
        DateTimeOffset executedAt,
        IReadOnlyCollection<SourceItem> statistics,
        IReadOnlyCollection<SourceItem> antystics,
        IReadOnlyCollection<Guid> statisticIds,
        IReadOnlyCollection<Guid> antysticIds,
        IReadOnlyCollection<string> sourceFailures,
        IReadOnlyCollection<string> duplicates,
        IReadOnlyCollection<ValidationIssue> validationIssues,
        bool dryRun)
    {
        var statList = statistics.ToList();
        var statIds = statisticIds.ToList();
        var statDrafts = new List<GeneratedDraft>(statList.Count);
        for (var i = 0; i < statList.Count; i++)
        {
            var item = statList[i];
            var id = i < statIds.Count ? statIds[i] : Guid.Empty;
            statDrafts.Add(new GeneratedDraft
            {
                Id = id,
                Title = Trim(item.Title, TitleMaxLength),
                Summary = Trim(BuildStatisticSummary(item), SummaryMaxLength),
                SourceUrl = item.SourceUrl,
                SourceCitation = item.SourceName,
                Kind = "statistic"
            });
        }

        var antList = antystics.ToList();
        var antIds = antysticIds.ToList();
        var antystykDrafts = new List<GeneratedDraft>(antList.Count);
        for (var i = 0; i < antList.Count; i++)
        {
            var item = antList[i];
            var id = i < antIds.Count ? antIds[i] : Guid.Empty;
            antystykDrafts.Add(new GeneratedDraft
            {
                Id = id,
                Title = Trim(item.Title, TitleMaxLength),
                Summary = Trim(BuildAntysticText(item), SummaryMaxLength),
                SourceUrl = item.SourceUrl,
                SourceCitation = item.SourceName,
                Kind = "antystyk"
            });
        }

        return new ContentGenerationResult
        {
            CreatedStatistics = statDrafts,
            CreatedAntystics = antystykDrafts,
            ExecutedAt = executedAt,
            DryRun = dryRun,
            SourceFailures = sourceFailures,
            SkippedDuplicates = duplicates,
            ValidationFailures = validationIssues.Select(v => v.Reason).Distinct().ToList(),
            ValidationIssues = validationIssues
        };
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

    private sealed record DuplicateSnapshot(HashSet<string> TitleKeys, HashSet<string> UrlKeys)
    {
        public IReadOnlyCollection<string> SkippedKeys => TitleKeys;
    }

    private sealed record FilteredItems(IReadOnlyCollection<SourceItem> Items, IReadOnlyCollection<string> SkippedKeys);

    private sealed record MetricExtraction(double? PercentageValue, string? Ratio);
}
