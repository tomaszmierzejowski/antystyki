using Microsoft.AspNetCore.Mvc;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/logs")]
public class LogsController : ControllerBase
{
    private readonly ILogger<LogsController> _logger;

    public LogsController(ILogger<LogsController> logger)
    {
        _logger = logger;
    }

    [HttpPost("client")]
    public IActionResult CaptureClientLog([FromBody] ClientLogRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Message is required." });
        }

        var severity = NormalizeSeverity(request.Severity);
        var trimmedMessage = TrimTo(request.Message, 2048);
        var trimmedStack = TrimTo(request.StackTrace, 4096);

        var sanitizedContext = SanitizeContext(request.Context);

        var payload = new
        {
            EventType = "frontend.js_error",
            Severity = severity,
            request.Component,
            request.Url,
            Context = sanitizedContext,
            Stack = trimmedStack
        };

        switch (severity)
        {
            case "warning":
                _logger.LogWarning("Client log: {Message} {@Payload}", trimmedMessage, payload);
                break;
            case "info":
                _logger.LogInformation("Client log: {Message} {@Payload}", trimmedMessage, payload);
                break;
            default:
                _logger.LogError("Client log: {Message} {@Payload}", trimmedMessage, payload);
                break;
        }

        return Accepted();
    }

    private static string NormalizeSeverity(string? severity) =>
        severity?.Trim().ToLowerInvariant() switch
        {
            "warning" or "warn" => "warning",
            "info" or "information" => "info",
            _ => "error"
        };

    private static string? TrimTo(string? input, int maxLength)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }

        return input.Length <= maxLength ? input : input[..maxLength];
    }

    private static Dictionary<string, string>? SanitizeContext(Dictionary<string, string>? context)
    {
        if (context is null || context.Count == 0)
        {
            return context;
        }

        var sanitized = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in context)
        {
            if (string.IsNullOrWhiteSpace(kvp.Key))
            {
                continue;
            }

            if (ContainsSensitiveKeyword(kvp.Key))
            {
                continue;
            }

            sanitized[kvp.Key] = TrimTo(kvp.Value, 256) ?? string.Empty;
        }

        return sanitized.Count == 0 ? null : sanitized;
    }

    private static bool ContainsSensitiveKeyword(string key)
    {
        return key.Contains("email", StringComparison.OrdinalIgnoreCase)
            || key.Contains("phone", StringComparison.OrdinalIgnoreCase)
            || key.Contains("name", StringComparison.OrdinalIgnoreCase)
            || key.Contains("token", StringComparison.OrdinalIgnoreCase)
            || key.Contains("secret", StringComparison.OrdinalIgnoreCase)
            || key.Contains("password", StringComparison.OrdinalIgnoreCase);
    }

    public sealed record ClientLogRequest
    {
        public string Message { get; init; } = string.Empty;
        public string? StackTrace { get; init; }
        public string? Component { get; init; }
        public string? Severity { get; init; }
        public string? Url { get; init; }
        public Dictionary<string, string>? Context { get; init; }
    }
}

