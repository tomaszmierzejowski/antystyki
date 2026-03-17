using System.Threading;
using System.Threading.Tasks;
using Antystics.Api.ContentGeneration.Models;

namespace Antystics.Api.ContentGeneration.Services;

public interface IOpenAiService
{
    Task<LlmGenerationResult?> AnalyzeAndGenerateAsync(SourceItem item, CancellationToken cancellationToken);
}

public class LlmGenerationResult
{
    public bool IsValid { get; set; }
    public string? Reason { get; set; }
    public double? PercentageValue { get; set; }
    public string? Ratio { get; set; }
    public string? Timeframe { get; set; }
    public string? ContextSentence { get; set; }
    public string? ReversedStatistic { get; set; }
}
