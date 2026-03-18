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

        var model = string.IsNullOrWhiteSpace(_options.GeminiModel) ? "gemini-2.5-flash" : _options.GeminiModel;
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
                // gemini-2.5-flash uses internal "thinking" tokens by default.
                // Those thinking tokens are counted against maxOutputTokens, leaving
                // almost nothing for the actual JSON — causing mid-string truncation.
                // Setting thinkingBudget: 0 disables thinking entirely (appropriate
                // for fast structured JSON extraction; deep reasoning not needed here).
                MaxOutputTokens = 8192,
                ThinkingConfig = new GeminiThinkingConfig { ThinkingBudget = 0 }
            }
        };

        const int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                _logger.LogDebug("Initiating Gemini POST request for '{Title}' (Attempt {Attempt}/{MaxRetries})...", item.Title, attempt, maxRetries);

                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(25)); // 25s hard limit per attempt

                using var response = await _httpClient.PostAsJsonAsync(url, requestBody, cts.Token).ConfigureAwait(false);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
                    var statusCode = (int)response.StatusCode;

                    if ((statusCode == 429 || statusCode == 503) && attempt < maxRetries)
                    {
                        var delayMs = (int)Math.Pow(2, attempt) * 1000;
                        _logger.LogWarning("Gemini API returned {StatusCode} for item '{Title}'. Retrying in {Delay}ms (Attempt {Attempt}/{MaxRetries}). Error: {Error}",
                            statusCode, item.Title, delayMs, attempt, maxRetries, errorBody);
                        await Task.Delay(delayMs, cancellationToken).ConfigureAwait(false);
                        continue;
                    }

                    _logger.LogError("Gemini API returned {StatusCode} for item '{Title}': {Error}",
                        statusCode, item.Title, errorBody);
                    return null;
                }

                var geminiResponse = await response.Content
                    .ReadFromJsonAsync<GeminiResponse>(cancellationToken: cancellationToken)
                    .ConfigureAwait(false);

                // Null-safe access — Gemini may return 0 candidates when content is filtered
                var candidate = geminiResponse?.Candidates?[0];
                var finishReason = candidate?.FinishReason ?? "unknown";

                if (finishReason == "MAX_TOKENS")
                {
                    _logger.LogError("Gemini hit MAX_TOKENS for item '{Title}'. JSON will be truncated. Increase maxOutputTokens or reduce thinkingBudget.", item.Title);
                    return null;
                }

                var text = candidate?.Content?.Parts?[0]?.Text;
                if (string.IsNullOrWhiteSpace(text))
                {
                    _logger.LogWarning("Gemini returned empty content for item '{Title}'. FinishReason: {Reason}",
                        item.Title, finishReason);
                    return null;
                }

                try
                {
                    var result = JsonSerializer.Deserialize<LlmGenerationResult>(text,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (result == null)
                    {
                        _logger.LogWarning("Failed to deserialize Gemini JSON for item '{Title}'. Raw: {Raw}", item.Title, text);
                    }

                    return result;
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "JSON parsing failed for item '{Title}'. Raw output from Gemini: {RawText}", item.Title, text);
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Exception or timeout calling Gemini API for item '{Title}' (Attempt {Attempt}/{MaxRetries}).", item.Title, attempt, maxRetries);

                if (attempt < maxRetries)
                {
                    var delayMs = (int)Math.Pow(2, attempt) * 1000;
                    await Task.Delay(delayMs, cancellationToken).ConfigureAwait(false);
                    continue;
                }

                // All retries exhausted — return null so the caller can use the regex fallback.
                // Never throw here; a single slow item must not crash the entire batch run.
                _logger.LogError("Gemini API failed after {MaxRetries} attempts for item '{Title}'. Falling back to regex extraction.", maxRetries, item.Title);
                return null;
            }
        }

        return null;
    }

    /// <summary>
    /// Mission-aligned system prompt. Produces sharp, Polish-language antistyki.
    /// Never generic. Never formulaic. Max 2 sentences.
    /// </summary>
    private static string BuildSystemInstruction() => """
        Jesteś ekspertem od "antystyk" dla platformy Antystyki.pl — krótkich, nieprzyzwoicie trafnych komentarzy
        do statystyk, które pomagają ludziom MYŚLEĆ przed udostępnianiem.

        Twoje zadanie: przeanalizować podaną statystykę i zwrócić WYŁĄCZNIE poprawny JSON (bez markdown, bez komentarzy).

        ═══════════════════════════════════════════════
        ZASADA KLUCZOWA — CO JEST STATYSTYKĄ, A CO NIE:
        ═══════════════════════════════════════════════
        STATYSTYKA (isValid=true) wymaga JEDNEGO z:
          a) Konkretny procent: "72% Polaków...", "co trzeci..."
          b) Proporcja z mianownikiem: "1 na 3 kierowców", "2/5 respondentów"
          c) Zmiana procentowa: "wzrost o 15%", "o 30% mniej"

        NIE SĄ STATYSTYKAMI — zawsze zwróć isValid=false:
          ✗ Surowe liczby BEZ mianownika: "20 milionów wyświetleń", "40 ofiar", "300 km", "45 minut"
          ✗ Newsy i zdarzenia: "X zaatakował Y", "Rząd ogłosił Z", wyniki wyborów bez %
          ✗ Historie ludzkie / reportaże: artykuły opisujące losy konkretnych osób
          ✗ Opinie / prognozy bez danych liczbowych

        ZASADA DLA PORTALI NEWSOWYCH (Polsat News, PAP, Gazeta.pl, TVN24 i podobne):
          Bądź EKSTRA SUROWY. Przyjmuj wyłącznie artykuły, gdzie tytuł lub opis WPROST zawiera % lub proporcję.
          Odrzucaj wszystko inne, nawet jeśli artykuł wspomina duże liczby.

        PRZYKŁADY ODRZUCONYCH POZYCJI:
        ❌ "Izraelskie filmy propagandowe miały 20 mln wyświetleń na YouTube"
           → Powód: surowa liczba bez mianownika — nie wiadomo jaki % czegokolwiek.
        ❌ "Drony ukraińskie uszkodziły rosyjski lotniskowiec"
           → Powód: wydarzenie newsowe bez żadnej statystyki procentowej.
        ❌ "8-latka przeszła 40 km przez las, żeby uratować babcię"
           → Powód: historia ludzka, odległość bez kontekstu statystycznego.

        ══════════════════════════
        POLA DO WYPEŁNIENIA (JSON):
        ══════════════════════════
        1. isValid (boolean) — czy artykuł zawiera prawdziwą statystykę procentową lub proporcję
        2. reason (string) — wymagany, nawet gdy isValid=true (wtedy ""); przy odrzuceniu: jasny, konkretny powód po polsku
        3. percentageValue (number) — wartość % jako liczba (np. 72.5); null jeśli brak danych
        4. ratio (string|null) — proporcja tekstowa np. "1/3"; null jeśli brak
        5. timeframe (string) — rok lub okres np. "2024", "Q1 2025"
        6. contextSentence (string) — krótki opis co mierzono, po polsku (max 120 znaków)
        7. reversedStatistic (string) — ANTYSTYKA (patrz zasady poniżej); "" jeśli isValid=false
        8. confidence (number) — pewność walidacji 0.0-1.0 (dla danych oficjalnych i jasnego % zwykle >=0.8)
        9. chartType (string) — typ wykresu: "pie" | "bar" | "trend" | "comparison"
           • pie        = jeden procent całości (np. "72% robi X")
           • bar        = porównanie wielu grup lub kategorii (np. "Niemcy 45%, Polska 38%, Francja 52%")
           • trend      = zmiana w czasie (rok do roku, miesięczna)
           • comparison = dwie kontrastujące wartości obok siebie (np. "biedni vs bogaci")
        10. chartLabelMain (string) — krótka polska etykieta głównej wartości, max 50 znaków
           Przykłady: "Polacy bez oszczędności", "Kierowcy po alkoholu", "Wzrost inflacji"
        11. chartLabelSecondary (string) — etykieta wartości uzupełniającej / grupy kontrastowej, max 50 znaków
            Domyślnie "Pozostałe" dla pie; dla comparison — nazwa grupy porównawczej

        ════════════════════════════════
        ZASADY PISANIA ANTYSTYKI (pole reversedStatistic):
        ════════════════════════════════
        • Max 2 zdania. Treściwa. Bez owijania w bawełnę.
        • PO POLSKU.
        • ALBO ostra ironia obnażająca absurd statystyki.
          Wzorzec: "Skoro X% [podmiot] [absurdalna konsekwencja], to może [ironiczna konkluzja]."
        • ALBO subtelna perspektywa szarej strefy zmieniająca sposób myślenia:
          "Zanim udostępnisz: te X% to... [nieoczywisty kontekst]."
        • NIGDY: "to skłania do refleksji", "warto się zastanowić", "to interesujące zjawisko", "ironia szykuje ripostę"

        PRZYKŁADY DOBREJ ANTYSTYKI:
        ✅ Stat: "72% Polaków nie przeczyta książki w tym roku"
           → "Skoro czytanie zastąpiliśmy scrollowaniem, może biblioteki powinny oferować subskrypcję TikToka z dopłatą do konta."
        ✅ Stat: "1 na 3 kierowców przyznaje się do jazdy po alkoholu"
           → "Pozostałe dwie trzecie nie przyznaje się — co nie znaczy, że nie jeżdżą."
        ✅ Stat: "60% Polaków nie ma żadnych oszczędności"
           → "Za to 100% banków ma dla nich ofertę kredytu na wakacje."

        PRZYKŁAD ZŁEJ ANTYSTYKI (NIGDY TAK):
        ❌ "To zjawisko skłania do głębszej refleksji nad stanem naszego społeczeństwa."
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
            reversedStatistic = new { type = "STRING" },
            confidence = new { type = "NUMBER" },
            chartType = new { type = "STRING" },
            chartLabelMain = new { type = "STRING" },
            chartLabelSecondary = new { type = "STRING" }
        },
        required = new[] { "isValid", "reason", "timeframe", "contextSentence", "reversedStatistic", "confidence", "chartType", "chartLabelMain", "chartLabelSecondary" }
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
        public int MaxOutputTokens { get; set; } = 8192;

        /// <summary>
        /// Controls Gemini 2.5's built-in thinking mode. When null the field is
        /// omitted from the request and the model uses its default thinking budget,
        /// which consumes most of maxOutputTokens and causes JSON truncation.
        /// Setting thinkingBudget: 0 disables thinking entirely for fast,
        /// deterministic structured-output calls.
        /// </summary>
        [JsonPropertyName("thinkingConfig")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public GeminiThinkingConfig? ThinkingConfig { get; set; }
    }

    private sealed class GeminiThinkingConfig
    {
        /// <summary>
        /// Maximum internal reasoning tokens. 0 = thinking disabled.
        /// </summary>
        [JsonPropertyName("thinkingBudget")]
        public int ThinkingBudget { get; set; }
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
