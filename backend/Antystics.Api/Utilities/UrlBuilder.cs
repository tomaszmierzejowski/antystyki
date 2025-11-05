using System;
using System.Globalization;
using System.Text;

namespace Antystics.Api.Utilities;

public static class UrlBuilder
{
    private const int DefaultMaxLength = 80;

    public static string GenerateSlug(string? input, string fallback = "antystyki", int maxLength = DefaultMaxLength)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            input = fallback;
        }

        var normalized = input!.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();
        var lastAppendedWasHyphen = false;

        foreach (var rune in normalized)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(rune);
            if (unicodeCategory == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsLetterOrDigit(rune))
            {
                builder.Append(rune);
                lastAppendedWasHyphen = false;
                continue;
            }

            if (char.IsWhiteSpace(rune) || rune == '-' || rune == '_')
            {
                if (!lastAppendedWasHyphen)
                {
                    builder.Append('-');
                    lastAppendedWasHyphen = true;
                }
            }
        }

        var slug = builder.ToString().Trim('-');

        if (slug.Length == 0)
        {
            slug = fallback;
        }

        if (slug.Length > maxLength)
        {
            slug = slug[..maxLength].Trim('-');
        }

        return slug;
    }

    public static string BuildCanonicalUrl(string? baseUrl, string resourceSegment, Guid id, string? title)
    {
        var slug = GenerateSlug(title, resourceSegment);
        var trimmedBase = string.IsNullOrWhiteSpace(baseUrl)
            ? "https://antystyki.pl"
            : baseUrl!.TrimEnd('/');
        var normalizedSegment = string.IsNullOrWhiteSpace(resourceSegment)
            ? "antystyki"
            : resourceSegment.Trim('/');

        return $"{trimmedBase}/{normalizedSegment}/{slug}-{id}";
    }
}


