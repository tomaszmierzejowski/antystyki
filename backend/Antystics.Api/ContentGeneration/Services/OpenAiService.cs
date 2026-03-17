using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Antystics.Api.ContentGeneration.Models;

namespace Antystics.Api.ContentGeneration.Services;

internal sealed class OpenAiService : IOpenAiService
{
    private readonly HttpClient _httpClient;
    private readonly ContentGenerationOptions _options;
    private readonly ILogger<OpenAiService> _logger;

    public OpenAiService(HttpClient httpClient, IOptions<ContentGenerationOptions> options, ILogger<OpenAiService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
        _httpClient.BaseAddress = new Uri("https://api.openai.com/v1/");
        
        if (!string.IsNullOrWhiteSpace(_options.OpenAiApiKey))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _options.OpenAiApiKey);
        }
    }

    public async Task<LlmGenerationResult?> AnalyzeAndGenerateAsync(SourceItem item, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.OpenAiApiKey))
        {
            _logger.LogWarning("OpenAI API key is missing. Skipping LLM generation.");
            return null;
        }

        var systemPrompt = @"You are a Senior Backend Architect and Product Visionary for 'Antystyki', a platform that turns real stats into witty gray-area stories to help people think deeper before they share. 
Your task is to analyze a raw statistic and generate a JSON response.
1. Determine if the statistic is high-quality, verifiable, and contains a clear percentage or ratio. If it's noisy or lacks a clear metric, mark it invalid.
2. If valid, extract the PercentageValue (number), Ratio (string if applicable), Timeframe (string, e.g. year), and ContextSentence (brief description of what is measured).
3. Crucially, generate a 'ReversedStatistic'. This must be a witty, thought-provoking antistic that either has a sharp, ironic sense of humor pointing out the absurdity of the statistic OR lectures the audience by providing a nuanced 'gray-area' perspective. It MUST be in Polish.

Return strictly valid JSON with the following structure:
{
  ""isValid"": boolean,
  ""reason"": string (leave empty if valid, provide reason if invalid),
  ""percentageValue"": number (null if none),
  ""ratio"": string (null if none),
  ""timeframe"": string,
  ""contextSentence"": string,
  ""reversedStatistic"": string (the witty/ironic Polish text)
}";
        var userPrompt = $"Title: {item.Title}\nSummary: {item.Summary}\nPublisher: {item.Publisher ?? item.SourceName}\nPublishedAt: {item.PublishedAt}";

        var requestBody = new
        {
            model = _options.OpenAiModel,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            response_format = new { type = "json_object" },
            temperature = 0.7
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync("chat/completions", requestBody, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var errorString = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("OpenAI API call failed with status {StatusCode}: {ErrorDetails}", response.StatusCode, errorString);
                return null;
            }

            var responseData = await response.Content.ReadFromJsonAsync<OpenAiResponse>(cancellationToken: cancellationToken);
            var content = responseData?.Choices?[0]?.Message?.Content;
            
            if (string.IsNullOrWhiteSpace(content)) return null;

            return JsonSerializer.Deserialize<LlmGenerationResult>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call OpenAI for item {Title}", item.Title);
            return null;
        }
    }

    private class OpenAiResponse
    {
        [JsonPropertyName("choices")]
        public Choice[] Choices { get; set; } = Array.Empty<Choice>();
    }

    private class Choice
    {
        [JsonPropertyName("message")]
        public Message Message { get; set; } = new Message();
    }

    private class Message
    {
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }
}
