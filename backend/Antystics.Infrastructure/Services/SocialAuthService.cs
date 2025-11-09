using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Antystics.Core.Interfaces;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Antystics.Infrastructure.Services;

public class SocialAuthService : ISocialAuthService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SocialAuthService> _logger;

    public SocialAuthService(
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<SocialAuthService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<SocialUserInfo?> ValidateGoogleTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var clientId = _configuration["Authentication:Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
        {
            _logger.LogWarning("Google OAuth validation skipped: client ID not configured.");
            return null;
        }

        try
        {
            if (IsJwt(token))
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(token, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId },
                });

                if (string.IsNullOrWhiteSpace(payload.Email))
                {
                    _logger.LogWarning("Google OAuth validation failed: email missing in token payload.");
                    return null;
                }

                return new SocialUserInfo(
                    Provider: "google",
                    ProviderUserId: payload.Subject,
                    Email: payload.Email,
                    FullName: payload.Name);
            }

            var httpClient = _httpClientFactory.CreateClient("google-oauth");
            var userInfo = await FetchGoogleUserInfoAsync(httpClient, token, cancellationToken);
            if (userInfo is null)
            {
                return null;
            }

            return new SocialUserInfo(
                Provider: "google",
                ProviderUserId: userInfo.Subject,
                Email: userInfo.Email,
                FullName: userInfo.Name);
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Google OAuth validation failed: invalid token.");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Google OAuth validation.");
            return null;
        }
    }

    private static bool IsJwt(string token)
    {
        return token.Count(c => c == '.') == 2;
    }

    private async Task<GoogleUserInfo?> FetchGoogleUserInfoAsync(HttpClient httpClient, string accessToken, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Google OAuth validation failed: userinfo endpoint returned {StatusCode}", response.StatusCode);
            return null;
        }

        var userInfo = await response.Content.ReadFromJsonAsync<GoogleUserInfo>(cancellationToken: cancellationToken);
        if (userInfo is null || string.IsNullOrWhiteSpace(userInfo.Email) || string.IsNullOrWhiteSpace(userInfo.Subject))
        {
            _logger.LogWarning("Google OAuth validation failed: insufficient user info.");
            return null;
        }

        if (!userInfo.EmailVerified)
        {
            _logger.LogWarning("Google OAuth validation failed: email not verified.");
            return null;
        }

        // Validate audience via tokeninfo endpoint
        var clientId = _configuration["Authentication:Google:ClientId"];
        var tokenInfoUri = $"https://oauth2.googleapis.com/tokeninfo?access_token={accessToken}";
        var tokenInfoResponse = await httpClient.GetAsync(tokenInfoUri, cancellationToken);
        if (!tokenInfoResponse.IsSuccessStatusCode)
        {
            _logger.LogWarning("Google OAuth validation warning: tokeninfo endpoint returned {StatusCode}", tokenInfoResponse.StatusCode);
        }
        else
        {
            var tokenInfo = await tokenInfoResponse.Content.ReadFromJsonAsync<GoogleTokenInfo>(cancellationToken: cancellationToken);
            if (tokenInfo?.Audience is not null && !string.Equals(tokenInfo.Audience, clientId, StringComparison.Ordinal))
            {
                _logger.LogWarning("Google OAuth validation failed: audience mismatch.");
                return null;
            }
        }

        return userInfo;
    }

    private sealed class GoogleUserInfo
    {
        [JsonPropertyName("sub")]
        public string Subject { get; init; } = string.Empty;

        [JsonPropertyName("name")]
        public string? Name { get; init; }

        [JsonPropertyName("email")]
        public string Email { get; init; } = string.Empty;

        [JsonPropertyName("email_verified")]
        public bool EmailVerified { get; init; }
    }

    private sealed class GoogleTokenInfo
    {
        [JsonPropertyName("audience")]
        public string? Audience { get; init; }
    }
}


