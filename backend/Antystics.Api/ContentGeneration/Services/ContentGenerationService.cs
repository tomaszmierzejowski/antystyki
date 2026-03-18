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
    private readonly IOpenAiService _openAiService;
    private readonly ContentGenerationOptions _options;
    private readonly ApplicationDbContext _dbContext;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<ContentGenerationService> _logger;
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
        ILogger<ContentGenerationService> logger,
        IOpenAiService openAiService)
    {
        _adapters = adapters;
        _sourceProvider = sourceProvider;
        _healthChecker = healthChecker;
        _httpClientFactory = httpClientFactory;
        _openAiService = openAiService;
        _dbContext = dbContext;
        _userManager = userManager;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<ContentGenerationResult> GenerateAsync(ContentGenerationRequest request, CancellationToken cancellationToken)
    {
        var executionTime = request.ExecutionTime ?? DateTimeOffset.UtcNow;
        var utcNow = executionTime.UtcDateTime;
        var sourceFilter = FilterSources(request.SourceIds);
        var sourceFailures = new List<string>(sourceFilter.UntrustedIds);
        var healthySources = await ValidateSourcesAsync(sourceFilter.Sources, cancellationToken).ConfigureAwait(false);
        sourceFailures.AddRange(healthySources.UnhealthyIds);
        sourceFailures = sourceFailures.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        if (healthySources.UnhealthyIds.Count > 0)
        {
            _logger.LogWarning(
                "Content generation: {Count} source(s) failed health check and will be skipped: {Sources}",
                healthySources.UnhealthyIds.Count,
                string.Join(", ", healthySources.UnhealthyIds));
        }

        var candidateItems = await FetchCandidatesAsync(healthySources.HealthySources, cancellationToken).ConfigureAwait(false);
        candidateItems = candidateItems
            .Select(SanitizeItem)
            .Where(i => i != null)
            .Cast<SourceItem>()
            .Select(item => item with
            {
                IsTrustedSource = true,
                GenerationKey = BuildGenerationKey(item, executionTime)
            })
            .ToList();

        var targetStats = Clamp(request.TargetStatistics, _options.MinStatistics, _options.MaxStatistics);
        var targetAntystics = Clamp(request.TargetAntystics, _options.MinAntystics, _options.MaxAntystics);

        var filteredCandidates = request.AllowDuplicates
            ? new FilteredItems(candidateItems, Array.Empty<string>())
            : FilterDuplicates(candidateItems, await LoadRecentDuplicateKeysAsync(utcNow, cancellationToken).ConfigureAwait(false));

        // Limit the number of items sent to the LLM to stay under provider rate limits.
        var maxToProcess = Math.Max(24, targetStats * 5);
        var desiredPoland = (int)Math.Ceiling(maxToProcess * _options.PolandRatioFloor);
        
        var polandCandidates = filteredCandidates.Items.Where(i => i.PolandFocus).ToList();
        var otherCandidates = filteredCandidates.Items.Where(i => !i.PolandFocus)
            .OrderByDescending(i => i.PublishedAt ?? DateTimeOffset.MinValue)
            .ToList();
            
        var itemsToProcess = polandCandidates.Take(desiredPoland)
            .Concat(otherCandidates)
            .Concat(polandCandidates.Skip(desiredPoland))
            .Take(maxToProcess)
            .ToList();

        // 3. Validate (makes external LLM API calls)
        var validation = await ValidateItemsAsync(itemsToProcess, utcNow, cancellationToken).ConfigureAwait(false);
        var validatedItems = validation.ValidItems;

        if (validatedItems.Count == 0)
        {
            var rejectionSummary = validation.Issues.Count > 0
                ? string.Join(" | ", validation.Issues
                    .GroupBy(v => v.Reason)
                    .OrderByDescending(g => g.Count())
                    .Take(5)
                    .Select(g => $"{g.Key} ({g.Count()}x)"))
                : "no candidates fetched";

            _logger.LogError(
                "Content generation produced 0 valid items from {Candidates} candidates. " +
                "Skipped duplicates: {Duplicates}. Source failures: {SourceFailures}. " +
                "Rejection reasons: {Reasons}",
                itemsToProcess.Count,
                filteredCandidates.SkippedKeys.Count,
                sourceFailures.Count,
                rejectionSummary);

            return new ContentGenerationResult
            {
                CreatedAntystics = Array.Empty<GeneratedDraft>(),
                CreatedStatistics = Array.Empty<GeneratedDraft>(),
                ExecutedAt = executionTime,
                DryRun = request.DryRun,
                ValidationFailures = validation.Issues.Select(v => v.Reason).Distinct().ToList(),
                SourceFailures = sourceFailures,
                ValidationIssues = validation.Issues,
                SkippedDuplicates = filteredCandidates.SkippedKeys,
                Outcome = "failed_no_valid_data"
            };
        }

        // 4. Select final items from the validated ones
        // We wrap validatedItems in a FilteredItems dto so SelectStatistics can reuse it
        var finalFiltered = new FilteredItems(validatedItems, filteredCandidates.SkippedKeys);
        var selectedStatistics = SelectStatistics(finalFiltered, targetStats);
        var selectedAntystics = SelectAntystics(selectedStatistics, targetAntystics);

        if (request.DryRun)
        {
            return BuildResult(
                executionTime,
                selectedStatistics,
                selectedAntystics,
                Array.Empty<Guid>(),
                Array.Empty<Guid>(),
                sourceFailures,
                filteredCandidates.SkippedKeys,
                validation.Issues,
                true);
        }

        var systemUserId = await EnsureSystemUserAsync(cancellationToken).ConfigureAwait(false);
        var statisticEntities = selectedStatistics
            .Select(stat => MapToStatistic(stat, systemUserId, utcNow))
            .ToList();
        var statisticIdsByGenerationKey = statisticEntities
            .Where(s => !string.IsNullOrWhiteSpace(s.GenerationKey))
            .ToDictionary(s => s.GenerationKey!, s => s.Id, StringComparer.OrdinalIgnoreCase);

        var antisticEntities = new List<Antistic>(selectedAntystics.Count);
        foreach (var antystyk in selectedAntystics)
        {
            Guid? sourceStatisticId = null;
            if (!string.IsNullOrWhiteSpace(antystyk.GenerationKey) &&
                statisticIdsByGenerationKey.TryGetValue(antystyk.GenerationKey, out var linkedStatisticId))
            {
                sourceStatisticId = linkedStatisticId;
            }

            antisticEntities.Add(MapToAntystic(antystyk, systemUserId, utcNow, sourceStatisticId));
        }

        _dbContext.Statistics.AddRange(statisticEntities);
        _dbContext.Antistics.AddRange(antisticEntities);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (DbUpdateException ex) when (!request.AllowDuplicates && IsGenerationKeyConflict(ex))
        {
            _logger.LogWarning(ex, "Generation key conflict detected. This run produced only duplicates already queued for review.");
            return new ContentGenerationResult
            {
                CreatedStatistics = Array.Empty<GeneratedDraft>(),
                CreatedAntystics = Array.Empty<GeneratedDraft>(),
                ExecutedAt = executionTime,
                DryRun = false,
                SourceFailures = sourceFailures,
                SkippedDuplicates = filteredCandidates.SkippedKeys,
                ValidationFailures = validation.Issues.Select(v => v.Reason).Distinct().ToList(),
                ValidationIssues = validation.Issues,
                Outcome = "duplicate_conflict"
            };
        }

        return BuildResult(
            executionTime,
            selectedStatistics,
            selectedAntystics,
            statisticEntities.Select(s => s.Id).ToList(),
            antisticEntities.Select(a => a.Id).ToList(),
            sourceFailures,
            filteredCandidates.SkippedKeys,
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
            if (!item.IsTrustedSource)
            {
                issues.Add(BuildIssue(item, "Source is not in the trusted-source allowlist.", null, null));
                continue;
            }

            if (item.PublishedAt.HasValue && item.PublishedAt.Value.UtcDateTime < utcNow.AddDays(-14))
            {
                issues.Add(BuildIssue(item, "Stale item (older than 14 days).", null, null));
                continue;
            }

            if (string.IsNullOrWhiteSpace(item.SourceUrl))
            {
                issues.Add(BuildIssue(item, "Missing source URL - cannot verify provenance.", null, null));
                continue;
            }

            // Pre-screen: skip items with no percentage or ratio signal in the RSS snippet.
            // This avoids burning Gemini API calls on pure news events (court decisions, political
            // statements, deaths) that cannot possibly yield a valid statistic.
            var combined = $"{item.Title} {item.Summary}";
            var hasPercent = PercentageRegex.IsMatch(combined)
                || combined.Contains("proc.", StringComparison.OrdinalIgnoreCase)
                || combined.Contains("procent", StringComparison.OrdinalIgnoreCase)
                || combined.Contains(" pkt proc", StringComparison.OrdinalIgnoreCase);
            var hasRatio = RatioRegex.IsMatch(combined)
                || combined.Contains("co drugi", StringComparison.OrdinalIgnoreCase)
                || combined.Contains("co trzeci", StringComparison.OrdinalIgnoreCase)
                || combined.Contains("co czwarty", StringComparison.OrdinalIgnoreCase)
                || combined.Contains("co piąty", StringComparison.OrdinalIgnoreCase)
                || combined.Contains("co dziesiąty", StringComparison.OrdinalIgnoreCase);

            if (!hasPercent && !hasRatio)
            {
                issues.Add(BuildIssue(item, "Pre-screen: no percentage or ratio found in title or summary — not a statistical article.", null, null));
                continue;
            }

            var statusCode = await GetSourceStatusCodeAsync(item.SourceUrl, sourceStatusCache, cancellationToken).ConfigureAwait(false);
            if (_options.RequireSourceUrlHttp200 && statusCode != 200)
            {
                var reason = statusCode.HasValue
                    ? $"Source URL returned HTTP {statusCode}."
                    : "Source URL could not be verified (network/timeout).";
                issues.Add(BuildIssue(item, reason, null, statusCode));
                continue;
            }

            if (statusCode.HasValue && statusCode != 200)
            {
                issues.Add(BuildIssue(item, $"Source URL returned HTTP {statusCode}.", null, statusCode));
                continue;
            }

            var llmResult = await _openAiService.AnalyzeAndGenerateAsync(item, cancellationToken).ConfigureAwait(false);

            double percentageValue;
            string? ratio;
            string timeframe;
            string context;
            string? reversedStatistic;
            double validationConfidence;

            if (llmResult == null)
            {
                var keyMissing = string.IsNullOrWhiteSpace(_options.GeminiApiKey) && string.IsNullOrWhiteSpace(_options.OpenAiApiKey);
                var fallbackReason = keyMissing ? "No LLM key configured" : "LLM generation failed or returned empty";

                // Fall back to local regex extraction.
                // Items are NOT skipped; they proceed without an LLM-generated antistic.
                _logger.LogDebug("{Reason} for '{Title}', falling back to regex extraction.", fallbackReason, item.Title);
                var metric = ExtractMetric($"{item.Title} {item.Summary}");
                if (metric.PercentageValue == null)
                {
                    issues.Add(BuildIssue(item, $"{fallbackReason} and regex found no percentage or ratio metric.", metric, statusCode));
                    continue;
                }

                percentageValue = metric.PercentageValue.Value;
                ratio = metric.Ratio;
                timeframe = BuildTimeframe(item);
                context = ExtractContextSentence(item);
                reversedStatistic = null; // no witty antistic without LLM
                validationConfidence = 0.65;
            }
            else if (!llmResult.IsValid)
            {
                var reason = llmResult.Reason ?? "LLM rejected item without a specific reason.";
                _logger.LogDebug("LLM rejected item '{Title}'. Reason: {Reason}", item.Title, reason);
                issues.Add(BuildIssue(item, reason, null, statusCode));
                continue;
            }
            else
            {
                // Reject items where the LLM says isValid=true but provides no usable percentage.
                // A null or zero percentageValue means the article has no real statistical metric.
                if (!llmResult.PercentageValue.HasValue || llmResult.PercentageValue.Value <= 0)
                {
                    var noMetricReason = "LLM marked valid but returned no usable percentage (raw count or missing denominator).";
                    _logger.LogDebug("Rejecting item '{Title}': {Reason}", item.Title, noMetricReason);
                    issues.Add(BuildIssue(item, noMetricReason, null, statusCode));
                    continue;
                }

                percentageValue = llmResult.PercentageValue.Value;
                ratio = llmResult.Ratio;
                timeframe = llmResult.Timeframe ?? BuildTimeframe(item);
                context = llmResult.ContextSentence ?? ExtractContextSentence(item);
                reversedStatistic = llmResult.ReversedStatistic;
                validationConfidence = llmResult.Confidence ?? 0.85;
            }

            if (validationConfidence < _options.MinimumValidationConfidence)
            {
                issues.Add(BuildIssue(item, $"Validation confidence {validationConfidence:0.00} below threshold {_options.MinimumValidationConfidence:0.00}.", null, statusCode));
                continue;
            }

            var numericStatement = BuildNumericStatement(percentageValue, context, timeframe);

            valid.Add(item with
            {
                PercentageValue = percentageValue,
                Ratio = ratio,
                Timeframe = timeframe,
                ContextSentence = context,
                NumericStatement = numericStatement,
                ReversedStatistic = reversedStatistic,
                Publisher = item.Publisher ?? item.SourceName,
                SourceStatusCode = statusCode,
                SourceUrlVerified = statusCode == 200,
                ValidationConfidence = validationConfidence,
                ChartType = llmResult?.ChartType,
                ChartLabelMain = llmResult?.ChartLabelMain,
                ChartLabelSecondary = llmResult?.ChartLabelSecondary
            });
        }

        return (valid, issues);
    }

    private static ValidationIssue BuildIssue(SourceItem item, string reason, MetricExtraction? metric, int? statusCode)
    {
        return new ValidationIssue
        {
            SourceId = item.SourceId,
            SourceName = item.SourceName,
            Title = item.Title,
            Reason = reason,
            SourceUrl = item.SourceUrl,
            SourceStatusCode = statusCode,
            PercentageValue = metric?.PercentageValue,
            Ratio = metric?.Ratio,
            Timeframe = item.Timeframe ?? item.PublishedAt?.ToString("yyyy-MM-dd"),
            ContextSentence = ExtractContextSentence(item),
            ValidationConfidence = item.ValidationConfidence,
            TrustedSource = item.IsTrustedSource
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
        var maxAttempts = Math.Max(1, _options.SourceUrlCheckMaxAttempts);
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var response = await client.GetAsync(sourceUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);
                var statusCode = (int)response.StatusCode;
                cache[sourceUrl] = statusCode;
                return statusCode;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                if (attempt == maxAttempts)
                {
                    _logger.LogWarning(ex, "Source URL check failed for {Url} after {Attempts} attempts.", sourceUrl, maxAttempts);
                    cache[sourceUrl] = null;
                    return null;
                }

                var delayMs = (int)Math.Pow(2, attempt) * Math.Max(500, _options.RetryBaseDelaySeconds * 1000);
                _logger.LogDebug(ex, "Source URL check failed for {Url} on attempt {Attempt}/{MaxAttempts}. Retrying in {DelayMs} ms.", sourceUrl, attempt, maxAttempts, delayMs);
                await Task.Delay(delayMs, cancellationToken).ConfigureAwait(false);
            }
        }

        cache[sourceUrl] = null;
        return null;
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

    private SourceFilterResult FilterSources(IReadOnlyCollection<string>? sourceIds)
    {
        var sources = _sourceProvider.GetAll();

        var enabledIds = _options.EnabledSourceIds?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase) ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var requestIds = sourceIds?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase) ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var selected = sources;
        if (enabledIds.Count == 0 && requestIds.Count == 0)
        {
            selected = sources;
        }
        else
        {
            var filterSet = requestIds.Count > 0 ? requestIds : enabledIds;
            selected = sources.Where(s => filterSet.Contains(s.Id)).ToList();
        }

        var trusted = new List<ContentSource>();
        var rejected = new List<string>();
        foreach (var source in selected)
        {
            if (_options.EnforceTrustedSources && !IsTrustedSource(source))
            {
                rejected.Add(source.Id);
                continue;
            }

            trusted.Add(source);
        }

        return new SourceFilterResult(trusted, rejected);
    }

    private bool IsTrustedSource(ContentSource source)
    {
        if (source.Reliability < Math.Max(1, _options.MinimumSourceReliability))
        {
            return false;
        }

        var allowlist = _options.TrustedSourceIds?
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (allowlist == null || allowlist.Count == 0)
        {
            return true;
        }

        return allowlist.Contains(source.Id);
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

            IReadOnlyCollection<SourceItem> fetched = Array.Empty<SourceItem>();
            var maxAttempts = Math.Max(1, _options.SourceFetchMaxAttempts);
            var fetchedSuccessfully = false;
            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    fetched = await adapter.FetchAsync(source, cancellationToken).ConfigureAwait(false);
                    fetchedSuccessfully = true;
                    break; // Success (empty or non-empty) — do not retry on successful response.
                }
                catch (OperationCanceledException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    if (attempt >= maxAttempts)
                    {
                        _logger.LogWarning(ex, "Fetch failed for source {SourceId} after {MaxAttempts} attempt(s). Skipping source.", source.Id, maxAttempts);
                        break;
                    }

                    var delayMs = (int)Math.Pow(2, attempt) * Math.Max(500, _options.RetryBaseDelaySeconds * 1000);
                    _logger.LogDebug(ex, "Fetch failed for source {SourceId} on attempt {Attempt}/{MaxAttempts}. Retrying in {DelayMs} ms.",
                        source.Id, attempt, maxAttempts, delayMs);
                    await Task.Delay(delayMs, cancellationToken).ConfigureAwait(false);
                }
            }

            if (!fetchedSuccessfully)
            {
                _logger.LogInformation("Source {SourceId} ({SourceType}) could not be fetched after {MaxAttempts} attempt(s).", source.Id, source.Type, maxAttempts);
            }

            _logger.LogInformation(
                "Source {SourceId} ({SourceType}) returned {Count} items.",
                source.Id, source.Type, fetched.Count);

            if (fetched.Count == 0)
            {
                continue;
            }

            items.AddRange(fetched.Select(item => item with
            {
                FetchedAtUtc = DateTimeOffset.UtcNow,
                IsTrustedSource = true
            }));
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
            .Select(s => new { s.Title, s.SourceUrl, s.GenerationKey })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var recentAntysticTitles = await _dbContext.Antistics
            .Where(a => a.CreatedAt >= windowStart)
            .Select(a => new { a.Title, a.SourceUrl, a.GenerationKey })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var titleSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var urlSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var generationKeySet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

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

            if (!string.IsNullOrWhiteSpace(row.GenerationKey))
            {
                generationKeySet.Add(row.GenerationKey.Trim());
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

            if (!string.IsNullOrWhiteSpace(row.GenerationKey))
            {
                generationKeySet.Add(row.GenerationKey.Trim());
            }
        }

        return new DuplicateSnapshot(titleSet, urlSet, generationKeySet);
    }

    private FilteredItems FilterDuplicates(IReadOnlyCollection<SourceItem> items, DuplicateSnapshot duplicates)
    {
        var skipped = new List<string>();
        var filtered = new List<SourceItem>();

        foreach (var item in items)
        {
            var titleKey = item.Title.Trim();
            var urlKey = item.SourceUrl.Trim();
            var generationKey = item.GenerationKey?.Trim();

            if ((!string.IsNullOrWhiteSpace(generationKey) && duplicates.GenerationKeys.Contains(generationKey)) ||
                duplicates.TitleKeys.Contains(titleKey) ||
                duplicates.UrlKeys.Contains(urlKey))
            {
                skipped.Add(!string.IsNullOrWhiteSpace(generationKey) ? generationKey : titleKey);
                continue;
            }

            if (filtered.Any(f =>
                    (!string.IsNullOrWhiteSpace(generationKey) && f.GenerationKey != null && f.GenerationKey.Equals(generationKey, StringComparison.OrdinalIgnoreCase)) ||
                    f.Title.Equals(titleKey, StringComparison.OrdinalIgnoreCase) ||
                    f.SourceUrl.Equals(urlKey, StringComparison.OrdinalIgnoreCase)))
            {
                skipped.Add(!string.IsNullOrWhiteSpace(generationKey) ? generationKey : titleKey);
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
        var chartData = BuildStatisticChartData(item);
        if (!ValidateStatisticChartPayload(chartData))
        {
            chartData = JsonSerializer.Serialize(new
            {
                metricValue = item.PercentageValue,
                metricUnit = "%",
                metricLabel = Trim(item.ContextSentence ?? item.Title, 100),
                chartSuggestion = new
                {
                    type = "pie",
                    unit = "%",
                    dataPoints = new[]
                    {
                        new { label = Trim(item.ChartLabelMain ?? item.ContextSentence ?? item.Title, 50), value = Math.Round(item.PercentageValue ?? 0, 1) },
                        new { label = "Pozostałe", value = Math.Round(Math.Max(0, 100 - (item.PercentageValue ?? 0)), 1) }
                    }
                }
            });
        }

        return new Statistic
        {
            Id = Guid.NewGuid(),
            Title = Trim(item.Title, TitleMaxLength),
            Summary = Trim(BuildStatisticSummary(item), SummaryMaxLength),
            Description = Trim(item.Summary, SummaryMaxLength),
            SourceUrl = item.SourceUrl,
            SourceCitation = sourceCitation,
            GenerationKey = item.GenerationKey,
            ProvenanceData = BuildProvenanceData(item),
            ChartData = chartData,
            Status = ModerationStatus.Pending,
            CreatedAt = utcNow,
            CreatedByUserId = userId
        };
    }

    private Antistic MapToAntystic(SourceItem item, Guid userId, DateTime utcNow, Guid? sourceStatisticId)
    {
        var turned = BuildAntysticText(item);
        var (chartData, templateId) = BuildAntisticChartData(item);
        if (!ValidateAntisticChartPayload(chartData))
        {
            chartData = JsonSerializer.Serialize(new
            {
                templateId = "text-focused",
                title = Trim(item.Title, TitleMaxLength),
                description = Trim(turned, SummaryMaxLength),
                source = item.SourceUrl,
                textData = new
                {
                    mainStatistic = Trim(item.NumericStatement ?? item.Title, 180),
                    context = Trim(item.ContextSentence ?? item.Summary, 200),
                    comparison = item.Ratio
                }
            });
            templateId = "text-focused";
        }

        return new Antistic
        {
            Id = Guid.NewGuid(),
            Title = Trim(item.Title, TitleMaxLength),
            ReversedStatistic = Trim(turned, SummaryMaxLength),
            SourceUrl = item.SourceUrl,
            GenerationKey = item.GenerationKey,
            ImageUrl = DefaultImageUrl,
            TemplateId = templateId,
            ChartData = chartData,
            Status = ModerationStatus.Pending,
            CreatedAt = utcNow,
            UserId = userId,
            SourceStatisticId = sourceStatisticId
        };
    }

    private static string BuildStatisticChartData(SourceItem item)
    {
        var suggestion = BuildChartSuggestion(item);
        return JsonSerializer.Serialize(new
        {
            metricValue = item.PercentageValue,
            metricUnit = "%",
            metricLabel = Trim(item.ChartLabelMain ?? item.ContextSentence ?? item.Title, 100),
            chartSuggestion = new
            {
                type = suggestion.Type,
                unit = suggestion.Unit,
                dataPoints = suggestion.Points.Select(p => new { label = p.Label, value = Math.Round(p.Value, 2) })
            }
        });
    }

    private static (string ChartData, string TemplateId) BuildAntisticChartData(SourceItem item)
    {
        var suggestion = BuildChartSuggestion(item);
        switch (suggestion.Type)
        {
            case "line":
            {
                var json = JsonSerializer.Serialize(new
                {
                    templateId = "single-chart",
                    title = Trim(item.Title, TitleMaxLength),
                    description = Trim(BuildAntysticText(item), SummaryMaxLength),
                    source = item.SourceUrl,
                    singleChartData = new
                    {
                        title = Trim(item.Title, 120),
                        type = "line",
                        points = suggestion.Points.Select(p => new { label = p.Label, value = Math.Round(p.Value, 2) }),
                        unit = suggestion.Unit
                    }
                });
                return (json, "single-chart");
            }
            case "bar":
            {
                var json = JsonSerializer.Serialize(new
                {
                    templateId = "single-chart",
                    title = Trim(item.Title, TitleMaxLength),
                    description = Trim(BuildAntysticText(item), SummaryMaxLength),
                    source = item.SourceUrl,
                    singleChartData = new
                    {
                        title = Trim(item.Title, 120),
                        type = "bar",
                        points = suggestion.Points.Select(p => new { label = p.Label, value = Math.Round(p.Value, 2) }),
                        unit = suggestion.Unit
                    }
                });
                return (json, "single-chart");
            }
            default:
            {
                var piePoints = NormalizePiePoints(suggestion.Points);
                var pieSegments = piePoints.Select((p, index) => new
                {
                    label = p.Label,
                    percentage = Math.Round(p.Value, 1),
                    color = index == 0 ? "#ef4444" : "#e5e7eb"
                });

                var json = JsonSerializer.Serialize(new
                {
                    templateId = "single-chart",
                    title = Trim(item.Title, TitleMaxLength),
                    description = Trim(BuildAntysticText(item), SummaryMaxLength),
                    source = item.SourceUrl,
                    singleChartData = new
                    {
                        title = Trim(item.Title, 120),
                        type = "pie",
                        segments = pieSegments
                    }
                });
                return (json, "single-chart");
            }
        }
    }

    private static ChartSuggestion BuildChartSuggestion(SourceItem item)
    {
        var trendPoints = ExtractTrendPoints(item);
        if (trendPoints.Count >= 2)
        {
            return new ChartSuggestion("line", item.ChartType?.Equals("trend", StringComparison.OrdinalIgnoreCase) == true ? "%" : "%", trendPoints);
        }

        var main = Math.Round(Math.Clamp(item.PercentageValue ?? 0, 0, 100), 1);
        var secondary = Math.Round(Math.Max(0, 100 - main), 1);
        var mainLabel = Trim(item.ChartLabelMain ?? item.ContextSentence ?? item.Title, 50);
        var secondaryLabel = Trim(item.ChartLabelSecondary ?? "Pozostałe", 50);

        if (!string.IsNullOrWhiteSpace(item.Ratio) ||
            string.Equals(item.ChartType, "bar", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(item.ChartType, "comparison", StringComparison.OrdinalIgnoreCase))
        {
            return new ChartSuggestion("bar", "%", new[]
            {
                new ChartPoint(mainLabel, main),
                new ChartPoint(secondaryLabel, secondary)
            });
        }

        return new ChartSuggestion("pie", "%", new[]
        {
            new ChartPoint(mainLabel, main),
            new ChartPoint(secondaryLabel, secondary)
        });
    }

    private static IReadOnlyCollection<ChartPoint> ExtractTrendPoints(SourceItem item)
    {
        var text = $"{item.Title} {item.Summary}";
        var valueMatches = PercentageRegex.Matches(text);
        if (valueMatches.Count < 2)
        {
            return Array.Empty<ChartPoint>();
        }

        var values = new List<double>();
        foreach (Match match in valueMatches)
        {
            if (!double.TryParse(NormalizeNumber(match.Groups[1].Value), out var parsed))
            {
                continue;
            }

            values.Add(Math.Round(parsed, 2));
            if (values.Count >= 6)
            {
                break;
            }
        }

        if (values.Count < 2)
        {
            return Array.Empty<ChartPoint>();
        }

        var years = YearRegex.Matches(text)
            .Select(m => m.Groups[1].Value)
            .Distinct()
            .Take(values.Count)
            .ToList();

        var points = new List<ChartPoint>(values.Count);
        for (var i = 0; i < values.Count; i++)
        {
            var label = i < years.Count ? years[i] : $"Punkt {i + 1}";
            points.Add(new ChartPoint(label, values[i]));
        }

        return points;
    }

    private static IReadOnlyCollection<ChartPoint> NormalizePiePoints(IReadOnlyCollection<ChartPoint> points)
    {
        var asList = points.ToList();
        if (asList.Count == 0)
        {
            return new[]
            {
                new ChartPoint("Brak danych", 100)
            };
        }

        if (asList.Count == 1)
        {
            var main = Math.Clamp(asList[0].Value, 0, 100);
            return new[]
            {
                new ChartPoint(asList[0].Label, main),
                new ChartPoint("Pozostałe", Math.Max(0, 100 - main))
            };
        }

        var total = asList.Sum(p => Math.Max(0, p.Value));
        if (total <= 0)
        {
            return new[]
            {
                new ChartPoint("Brak danych", 100)
            };
        }

        var normalized = asList
            .Select(p => new ChartPoint(p.Label, (Math.Max(0, p.Value) / total) * 100))
            .ToList();

        var roundedTotal = normalized.Sum(p => Math.Round(p.Value, 1));
        if (roundedTotal > 100)
        {
            var overflow = roundedTotal - 100;
            var last = normalized[^1];
            normalized[^1] = last with { Value = Math.Max(0, last.Value - overflow) };
        }

        return normalized;
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

    private static string BuildAntysticText(SourceItem item)
    {
        if (!string.IsNullOrWhiteSpace(item.ReversedStatistic))
        {
            return Trim(item.ReversedStatistic, SummaryMaxLength);
        }

        var setup = item.NumericStatement ?? Trim(item.Title, 160);
        var percentText = item.PercentageValue.HasValue ? $"{item.PercentageValue:0.#}%" : "Ten odsetek";
        var turn = $"Jeśli {percentText} to nowa norma, ironia już szykuje ripostę.";

        return Trim($"{setup} — {turn}", SummaryMaxLength);
    }

    private static bool ValidateStatisticChartPayload(string chartData)
    {
        if (string.IsNullOrWhiteSpace(chartData))
        {
            return false;
        }

        try
        {
            using var doc = JsonDocument.Parse(chartData);
            if (!doc.RootElement.TryGetProperty("chartSuggestion", out var suggestion) || suggestion.ValueKind != JsonValueKind.Object)
            {
                return false;
            }

            if (!suggestion.TryGetProperty("type", out var typeNode) || typeNode.ValueKind != JsonValueKind.String)
            {
                return false;
            }

            var type = typeNode.GetString();
            return type is "pie" or "bar" or "line";
        }
        catch
        {
            return false;
        }
    }

    private static bool ValidateAntisticChartPayload(string chartData)
    {
        if (string.IsNullOrWhiteSpace(chartData))
        {
            return false;
        }

        try
        {
            using var doc = JsonDocument.Parse(chartData);
            if (!doc.RootElement.TryGetProperty("templateId", out var templateNode) || templateNode.ValueKind != JsonValueKind.String)
            {
                return false;
            }

            var template = templateNode.GetString();
            if (template is not ("two-column-default" or "single-chart" or "text-focused" or "comparison"))
            {
                return false;
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    private static string BuildGenerationKey(SourceItem item, DateTimeOffset executionTime)
    {
        var runDay = executionTime.UtcDateTime.ToString("yyyy-MM-dd");
        var topic = item.Topics?.FirstOrDefault() ?? "general";
        var url = string.IsNullOrWhiteSpace(item.SourceUrl) ? "no-url" : item.SourceUrl.Trim().ToLowerInvariant();
        return $"{runDay}|{item.SourceId.Trim().ToLowerInvariant()}|{topic.Trim().ToLowerInvariant()}|{url}";
    }

    private static string BuildProvenanceData(SourceItem item)
    {
        return JsonSerializer.Serialize(new
        {
            source = new
            {
                id = item.SourceId,
                name = item.SourceName,
                publisher = item.Publisher,
                url = item.SourceUrl,
                fetchedAtUtc = item.FetchedAtUtc
            },
            validation = new
            {
                trustedSource = item.IsTrustedSource,
                sourceUrlVerified = item.SourceUrlVerified,
                sourceStatusCode = item.SourceStatusCode,
                confidence = item.ValidationConfidence,
                percentageValue = item.PercentageValue,
                ratio = item.Ratio,
                timeframe = item.Timeframe
            }
        });
    }

    private static bool IsGenerationKeyConflict(DbUpdateException ex)
    {
        var message = ex.InnerException?.Message ?? ex.Message;
        return message.Contains("GenerationKey", StringComparison.OrdinalIgnoreCase);
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
            var statChartJson = BuildStatisticChartData(item);
            statDrafts.Add(new GeneratedDraft
            {
                Id = id,
                Title = Trim(item.Title, TitleMaxLength),
                Summary = Trim(BuildStatisticSummary(item), SummaryMaxLength),
                SourceUrl = item.SourceUrl,
                SourceCitation = item.SourceName,
                Kind = "statistic",
                ChartData = statChartJson,
                TemplateId = "single-chart"
            });
        }

        var antList = antystics.ToList();
        var antIds = antysticIds.ToList();
        var antystykDrafts = new List<GeneratedDraft>(antList.Count);
        for (var i = 0; i < antList.Count; i++)
        {
            var item = antList[i];
            var id = i < antIds.Count ? antIds[i] : Guid.Empty;
            var (antChartJson, antTemplateId) = BuildAntisticChartData(item);
            antystykDrafts.Add(new GeneratedDraft
            {
                Id = id,
                Title = Trim(item.Title, TitleMaxLength),
                Summary = Trim(BuildAntysticText(item), SummaryMaxLength),
                SourceUrl = item.SourceUrl,
                SourceCitation = item.SourceName,
                Kind = "antystyk",
                ChartData = antChartJson,
                TemplateId = antTemplateId
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
            ValidationIssues = validationIssues,
            Outcome = statDrafts.Count > 0 ? "succeeded" : "no_data"
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

    private sealed record DuplicateSnapshot(HashSet<string> TitleKeys, HashSet<string> UrlKeys, HashSet<string> GenerationKeys);

    private sealed record FilteredItems(IReadOnlyCollection<SourceItem> Items, IReadOnlyCollection<string> SkippedKeys);

    private sealed record MetricExtraction(double? PercentageValue, string? Ratio);
    private sealed record SourceFilterResult(IReadOnlyCollection<ContentSource> Sources, IReadOnlyCollection<string> UntrustedIds);
    private sealed record ChartPoint(string Label, double Value);
    private sealed record ChartSuggestion(string Type, string Unit, IReadOnlyCollection<ChartPoint> Points);
}
