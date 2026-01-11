using System;
using System.Net;
using System.Text.RegularExpressions;

namespace Antystics.Api.ContentGeneration;

internal static class ContentSanitizer
{
    private static readonly Regex HtmlTagRegex = new("<.*?>", RegexOptions.Compiled | RegexOptions.Singleline);
    private static readonly Regex MultiSpaceRegex = new("\\s{2,}", RegexOptions.Compiled);
    private static readonly string[] HtmlNoiseTokens = { "<html", "<head", "<meta", "<!doctype", "<body", "</html" };

    public static string CleanText(string? input, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        var decoded = WebUtility.HtmlDecode(input);
        var withoutTags = HtmlTagRegex.Replace(decoded, " ");
        var normalized = MultiSpaceRegex.Replace(withoutTags, " ").Trim();

        if (normalized.Length > maxLength)
        {
            normalized = normalized[..maxLength].Trim();
        }

        return normalized;
    }

    public static bool HasHtmlNoise(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return false;
        }

        var lower = input.AsSpan().Trim().ToString().ToLowerInvariant();
        foreach (var token in HtmlNoiseTokens)
        {
            if (lower.Contains(token))
            {
                return true;
            }
        }

        return false;
    }
}
