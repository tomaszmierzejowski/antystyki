using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Antystics.Api.Services.VisitorMetrics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Antystics.Api.Middleware;

internal sealed class VisitorMetricsMiddleware
{
    private static readonly string[] BotIndicators =
    {
        "bot", "crawler", "spider", "slurp", "bingpreview", "crawler", "preview", "scanner", "facebookexternalhit",
        "python-requests", "monitor", "pingdom"
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<VisitorMetricsMiddleware> _logger;

    public VisitorMetricsMiddleware(RequestDelegate next, ILogger<VisitorMetricsMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IVisitorMetricsService metricsService)
    {
        var shouldTrack = ShouldTrackRequest(context, out var userAgent);
        string ipAddress = string.Empty;
        bool isBot = false;

        if (shouldTrack)
        {
            ipAddress = ResolveIpAddress(context);
            isBot = IsBot(userAgent);
        }

        await _next(context);

        if (!shouldTrack)
        {
            return;
        }

        try
        {
            metricsService.RegisterVisit(DateTime.UtcNow, ipAddress, userAgent, context.Request.Path, isBot);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to record visitor metrics");
        }
    }

    private static bool ShouldTrackRequest(HttpContext context, out string userAgent)
    {
        userAgent = context.Request.Headers.UserAgent.ToString();

        if (!HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method))
        {
            return false;
        }

        if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase) ||
            context.Request.Path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (context.Request.Path.HasValue && context.Request.Path.Value!.Contains(".", StringComparison.Ordinal))
        {
            return false; // static assets
        }

        if (string.IsNullOrWhiteSpace(userAgent))
        {
            return false;
        }

        var accept = context.Request.Headers.Accept.ToString();
        if (!accept.Contains("text/html", StringComparison.OrdinalIgnoreCase) &&
            !accept.Contains("application/xhtml+xml", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
    }

    private static bool IsBot(string userAgent)
    {
        return BotIndicators.Any(indicator => userAgent.Contains(indicator, StringComparison.OrdinalIgnoreCase));
    }

    private static string ResolveIpAddress(HttpContext context)
    {
        static bool TryParseIp(string? value, out string parsed)
        {
            parsed = string.Empty;
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            if (IPAddress.TryParse(value.Trim(), out var ip))
            {
                parsed = ip.MapToIPv6().ToString();
                return true;
            }

            return false;
        }

        if (context.Request.Headers.TryGetValue("CF-Connecting-IP", out var cfConnectingIp) &&
            TryParseIp(cfConnectingIp.ToString(), out var cloudflareIp))
        {
            return cloudflareIp;
        }

        if (context.Request.Headers.TryGetValue("True-Client-IP", out var trueClientIp) &&
            TryParseIp(trueClientIp.ToString(), out var akamaiIp))
        {
            return akamaiIp;
        }

        if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            var first = forwardedFor.ToString().Split(',').FirstOrDefault();
            if (TryParseIp(first, out var parsedForwarded))
            {
                return parsedForwarded;
            }
        }

        if (context.Request.Headers.TryGetValue("X-Real-IP", out var realIp) &&
            TryParseIp(realIp.ToString(), out var nginxIp))
        {
            return nginxIp;
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
