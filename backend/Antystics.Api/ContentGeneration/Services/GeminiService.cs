using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Antystics.Api.ContentGeneration.Models;

namespace Antystics.Api.ContentGeneration.Services;

/// <summary>
/// LLM service backed by the Google Gemini REST API (generateContent endpoint).
/// Implements IOpenAiService so it is a drop-in replacement for OpenAiService.
/// Uses responseMimeType: "application/json" + responseSchema for reliable structured output.
/// </summary>
internal sealed class GeminiService : IOpenAiService
{
    private readonly HttpClient _httpClient;
    private readonly ContentGenerationOptions _options;
    private readonly ILogger<GeminiService> _logger;

    // Base URL — API key is appended as a query parameter per call
    private const string GeminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";

    public GeminiService(
        HttpClient httpClient,
        IOptions<ContentGenerationOptions> options,
        ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<LlmGenerationResult?> AnalyzeAndGenerateAsync(SourceItem item, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.GeminiApiKey))
        {
            _logger.LogWarning("Gemini API key is missing. Skipping LLM generation for item '{Title}'.", item.Title);
            return null;
        }

        var model = string.IsNullOrWhiteSpace(_options.GeminiModel) ? "gemini-2.0-flash" : _options.GeminiModel;
        var url = $"{GeminiBaseUrl}{model}:generateContent?key={_options.GeminiApiKey}";

        var userContent = $"Tytuł: {item.Title}\nOpis: {item.Summary}\nWydawca: {item.Publisher ?? item.SourceName}\nData publikacji: {item.PublishedAt?.ToString("yyyy-MM-dd") ?? "nieznana"}";

        var requestBody = new GeminiRequest
        {
            SystemInstruction = new GeminiContent
            {
                Parts = [new GeminiPart { Text = BuildSystemInstruction() }]
            },
            Contents =
            [
                new GeminiContent
                {
                    Role = "user",
                    Parts = [new GeminiPart { Text = userContent }]
                }
            ],
            GenerationConfig = new GeminiGenerationConfig
            {
                ResponseMimeType = "application/json",
                ResponseSchema = BuildResponseSchema(),
                Temperature = 0.75f,
                MaxOutputTokens = 600
            }
        };

        try
        {
            using var response = await _httpClient.PostAsJsonAsync(url, requestBody, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
                _logger.LogError("Gemini API returned {StatusCode} for item '{Title}': {Error}",
                    (int)response.StatusCode, item.Title, errorBody);
                return null;
            }

            var geminiResponse = await response.Content
                .ReadFromJsonAsync<GeminiResponse>(cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            // Null-safe access — Gemini may return 0 candidates when content is filtered
            var text = geminiResponse?.Candidates?[0]?.Content?.Parts?[0]?.Text;
            if (string.IsNullOrWhiteSpace(text))
            {
                _logger.LogWarning("Gemini returned empty content for item '{Title}'. FinishReason: {Reason}",
                    item.Title, geminiResponse?.Candidates?[0]?.FinishReason ?? "unknown");
                return null;
            }

            var result = JsonSerializer.Deserialize<LlmGenerationResult>(text,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (result == null)
            {
                _logger.LogWarning("Failed to deserialize Gemini JSON for item '{Title}'. Raw: {Raw}", item.Title, text);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception calling Gemini API for item '{Title}'.", item.Title);
            return null;
        }
    }

    /// <summary>
    /// Mission-aligned system prompt. Produces sharp, Polish-language antistyki.
    /// Never generic. Never formulaic. Max 2 sentences.
    /// </summary>
    private static string BuildSystemInstruction() => """
        Jesteś ekspertem od "antystyk" dla platformy Antystyki.pl — krótkich, nieprzyzwoicie trafnych komentarzy
        do statystyk, które pomagają ludziom MYŚLEĆ przed udostępnianiem.

        Twoje zadanie: przeanalizować podaną statystykę i zwrócić WYŁĄCZNIE poprawny JSON (bez markdown, bez komentarzy).

        ZASADY NIEZBĘDNE:
        1. Oceń, czy statystyka jest wiarygodna i zawiera konkretny % lub proporcję. Jeśli nie — oznacz jako invalid
           i podaj powód w polu "reason".
        2. Wydobądź: percentageValue (liczba, np. 72.5), ratio (string, np. "1/3", lub null),
           timeframe (rok lub okres, np. "2024"), contextSentence (krótki opis co mierzono, po polsku).
        3. Napisz "reversedStatistic" — ANTYSTYKĘ. Ma być:
           • Max 2 zdania. Treściwa. Bez owijania w bawełnę.
           • PO POLSKU.
           • ALBO ostra ironia obnażająca absurd statystyki. Wzorzec dobry: "Skoro X% [podmiot] [absurdalna konsekwencja], to może [ironica konkluzja]."
           • ALBO subtelna perspektywa szarej strefy zmieniająca sposób myślenia: "Zanim udostępnisz: te X% to... [nieoczywisty kontekst]."
           • NIGDY: zdania w stylu "to skłania do refleksji", "warto się zastanowić", "to interesujące zjawisko", "ironia szykuje ripostę".

        PRZYKŁADY DOBREJ ANTYSTYKI:
        ✅ Stat: "72% Polaków nie przeczyta książki w tym roku"
           → "Skoro czytanie zastąpiliśmy scrollowaniem, może biblioteki powinny oferować subskrypcję TikToka z dopłatą do konta."
        ✅ Stat: "1 na 3 kierowców przyznaje się do jazdy po alkoholu"
           → "Pozostałe dwie trzecie nie przyznaje się — co nie znaczy, że nie jeżdżą."
        ✅ Stat: "60% Polaków nie ma żadnych oszczędności"
           → "Za to 100% banków ma dla nich ofertę kredytu na wakacje."

        PRZYKŁAD ZŁEJ ANTYSTYKI (NIGDY TAK):
        ❌ "To zjawisko skłania do głębszej refleksji nad stanem naszego społeczeństwa."

        Pola "reason" — zawsze string, nawet jeśli isValid=true (wtedy pusty string "").
        """;

    /// <summary>
    /// JSON schema passed to Gemini's responseSchema field.
    /// Constrains the model to always emit the exact shape we need.
    /// </summary>
    private static object BuildResponseSchema() => new
    {
        type = "OBJECT",
        properties = new
        {
            isValid = new { type = "BOOLEAN" },
            reason = new { type = "STRING" },
            percentageValue = new { type = "NUMBER" },
            ratio = new { type = "STRING" },
            timeframe = new { type = "STRING" },
            contextSentence = new { type = "STRING" },
            reversedStatistic = new { type = "STRING" }
        },
        required = new[] { "isValid", "reason", "timeframe", "contextSentence", "reversedStatistic" }
    };

    // ── Request model ──────────────────────────────────────────────────────────

    private sealed class GeminiRequest
    {
        [JsonPropertyName("system_instruction")]
        public GeminiContent? SystemInstruction { get; set; }

        [JsonPropertyName("contents")]
        public GeminiContent[] Contents { get; set; } = [];

        [JsonPropertyName("generationConfig")]
        public GeminiGenerationConfig? GenerationConfig { get; set; }
    }

    private sealed class GeminiContent
    {
        [JsonPropertyName("role")]
        public string? Role { get; set; }

        [JsonPropertyName("parts")]
        public GeminiPart[] Parts { get; set; } = [];
    }

    private sealed class GeminiPart
    {
        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
    }

    private sealed class GeminiGenerationConfig
    {
        [JsonPropertyName("responseMimeType")]
        public string ResponseMimeType { get; set; } = "application/json";

        [JsonPropertyName("responseSchema")]
        public object? ResponseSchema { get; set; }

        [JsonPropertyName("temperature")]
        public float Temperature { get; set; } = 0.75f;

        [JsonPropertyName("maxOutputTokens")]
        public int MaxOutputTokens { get; set; } = 600;
    }

    // ── Response model ─────────────────────────────────────────────────────────

    private sealed class GeminiResponse
    {
        [JsonPropertyName("candidates")]
        public GeminiCandidate[]? Candidates { get; set; }
    }

    private sealed class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }

        [JsonPropertyName("finishReason")]
        public string? FinishReason { get; set; }
    }
}
