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
    /// <summary>Chart type hint from Gemini: "pie" | "bar" | "trend" | "comparison"</summary>
    public string? ChartType { get; set; }
    /// <summary>Short Polish label (≤50 chars) for the main value, e.g. "Polacy bez oszczędności"</summary>
    public string? ChartLabelMain { get; set; }
    /// <summary>Short Polish label (≤50 chars) for the secondary/contrast value, e.g. "Pozostałe"</summary>
    public string? ChartLabelSecondary { get; set; }
}
