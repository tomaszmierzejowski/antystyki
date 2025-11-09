namespace Antystics.Core.Interfaces;

public record SocialUserInfo(
    string Provider,
    string ProviderUserId,
    string Email,
    string? FullName);

public interface ISocialAuthService
{
    Task<SocialUserInfo?> ValidateGoogleTokenAsync(string idToken, CancellationToken cancellationToken = default);
}


