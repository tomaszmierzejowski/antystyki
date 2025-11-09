using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Antystics.Api.DTOs;
using Antystics.Core.Entities;
using Antystics.Core.Interfaces;
using Antystics.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly ISocialAuthService _socialAuthService;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ITokenService tokenService,
        IEmailService emailService,
        ISocialAuthService socialAuthService,
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _emailService = emailService;
        _socialAuthService = socialAuthService;
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // TODO: Validate CAPTCHA token
        
        // Check if user with this email already exists
        var existingUserByEmail = await _userManager.FindByEmailAsync(request.Email);
        
        if (existingUserByEmail != null)
        {
            if (existingUserByEmail.EmailConfirmed)
            {
                // Email is already verified - can't re-register
                return BadRequest(new { errors = new[] { "Ten email jest już zarejestrowany i zweryfikowany." } });
            }
            // User exists but is unverified - will be deleted below
        }
        
        // Check if user with this username already exists
        var existingUserByUsername = await _userManager.FindByNameAsync(request.Username);
        
        if (existingUserByUsername != null)
        {
            if (existingUserByUsername.EmailConfirmed)
            {
                // Username belongs to a verified user - can't use it
                return BadRequest(new { errors = new[] { "Ta nazwa użytkownika jest już zajęta." } });
            }
            // User exists but is unverified - will be deleted below
        }
        
        // Delete unverified users to allow re-registration
        var usersToDelete = new List<User>();
        if (existingUserByEmail != null && !existingUserByEmail.EmailConfirmed)
        {
            usersToDelete.Add(existingUserByEmail);
        }
        if (existingUserByUsername != null && !existingUserByUsername.EmailConfirmed && 
            existingUserByUsername.Id != existingUserByEmail?.Id) // Don't add same user twice
        {
            usersToDelete.Add(existingUserByUsername);
        }
        
        // Delete all unverified users and their tokens
        foreach (var userToDelete in usersToDelete)
        {
            var oldTokens = await _context.EmailVerificationTokens
                .Where(t => t.UserId == userToDelete.Id)
                .ToListAsync();
            _context.EmailVerificationTokens.RemoveRange(oldTokens);
            await _userManager.DeleteAsync(userToDelete);
        }
        
        if (usersToDelete.Any())
        {
            await _context.SaveChangesAsync();
        }
        
        // Create new user
        var user = new User
        {
            UserName = request.Username,
            Email = request.Email,
            EmailConfirmed = false,
            Provider = "local",
            ProviderUserId = null,
            // Assign roles based on email
            Role = ResolveRoleFromEmail(request.Email)
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        // Generate email verification token
        var verificationToken = _tokenService.GenerateEmailVerificationToken();
        var emailToken = new EmailVerificationToken
        {
            UserId = user.Id,
            Email = user.Email!,
            Token = verificationToken,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false
        };
        
        _context.EmailVerificationTokens.Add(emailToken);
        await _context.SaveChangesAsync();

        // Send verification email
        var frontendUrl = _configuration["FrontendUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var encodedToken = Uri.EscapeDataString(verificationToken);
        var verificationLink = $"{frontendUrl}/verify-email?token={encodedToken}";
        await _emailService.SendEmailVerificationAsync(user.Email!, verificationLink);

        return Ok(new { message = "Registration successful. Please check your email to verify your account." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        var emailHash = HashIdentifier(request.Email);
        
        if (user == null)
        {
            _logger.LogWarning("Failed login attempt eventType={EventType} reason={Reason} emailHash={EmailHash}",
                "auth.failed_login",
                "user_not_found",
                emailHash);
            return Unauthorized(new { message = "Invalid credentials" });
        }

        if (!user.EmailConfirmed)
        {
            _logger.LogWarning("Failed login attempt eventType={EventType} reason={Reason} emailHash={EmailHash}",
                "auth.failed_login",
                "email_not_verified",
                emailHash);
            return Unauthorized(new { message = "Please verify your email before logging in" });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        
        if (!result.Succeeded)
        {
            _logger.LogWarning("Failed login attempt eventType={EventType} reason={Reason} emailHash={EmailHash}",
                "auth.failed_login",
                "invalid_password",
                emailHash);
            return Unauthorized(new { message = "Invalid credentials" });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("Successful login eventType={EventType} emailHash={EmailHash}",
            "auth.login_success",
            emailHash);

        var token = _tokenService.GenerateJwtToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        var response = new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                Username = user.UserName!,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                Provider = string.IsNullOrWhiteSpace(user.Provider) ? "local" : user.Provider
            }
        };

        return Ok(response);
    }

    [HttpPost("social-login")]
    public async Task<IActionResult> SocialLogin([FromBody] SocialLoginRequest request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(new { message = "Social login token is required." });
        }

        var providerKey = string.IsNullOrWhiteSpace(request.Provider)
            ? "google"
            : request.Provider.Trim().ToLowerInvariant();

        if (!string.Equals(providerKey, "google", StringComparison.Ordinal))
        {
            return BadRequest(new { message = "Unsupported social provider" });
        }

        var socialUser = await _socialAuthService.ValidateGoogleTokenAsync(request.Token, cancellationToken);

        if (socialUser is null)
        {
            _logger.LogWarning("Failed social login eventType={EventType} reason={Reason} provider={Provider}",
                "auth.social_login_failed",
                "token_invalid",
                providerKey);
            return Unauthorized(new { message = "Invalid social login token" });
        }

        if (!string.IsNullOrWhiteSpace(request.ProviderUserId) &&
            !string.Equals(request.ProviderUserId, socialUser.ProviderUserId, StringComparison.Ordinal))
        {
            _logger.LogWarning("Failed social login eventType={EventType} reason={Reason} provider={Provider}",
                "auth.social_login_failed",
                "provider_user_mismatch",
                providerKey);
            return Unauthorized(new { message = "Invalid social login credentials" });
        }

        var emailHash = HashIdentifier(socialUser.Email);

        var user = await _userManager.Users
            .FirstOrDefaultAsync(u =>
                u.Provider == socialUser.Provider &&
                u.ProviderUserId == socialUser.ProviderUserId, cancellationToken);

        var isNewUser = false;
        var updateRequired = false;

        if (user is null)
        {
            user = await _userManager.FindByEmailAsync(socialUser.Email);

            if (user is not null)
            {
                if (!string.Equals(user.Provider, socialUser.Provider, StringComparison.OrdinalIgnoreCase) ||
                    !string.Equals(user.ProviderUserId, socialUser.ProviderUserId, StringComparison.Ordinal))
                {
                    user.Provider = socialUser.Provider;
                    user.ProviderUserId = socialUser.ProviderUserId;
                    updateRequired = true;
                }

                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    updateRequired = true;
                }
            }
            else
            {
                var username = await GenerateUniqueUsernameAsync(socialUser.FullName, socialUser.Email, cancellationToken);
                user = new User
                {
                    UserName = username,
                    Email = socialUser.Email,
                    EmailConfirmed = true,
                    Provider = socialUser.Provider,
                    ProviderUserId = socialUser.ProviderUserId,
                    Role = ResolveRoleFromEmail(socialUser.Email),
                    LastLoginAt = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                {
                    _logger.LogError("Failed to auto-create social user eventType={EventType} provider={Provider} emailHash={EmailHash} errors={Errors}",
                        "auth.social_registration_failed",
                        providerKey,
                        emailHash,
                        string.Join(",", createResult.Errors.Select(e => e.Code)));
                    return StatusCode(StatusCodes.Status500InternalServerError, new
                    {
                        message = "Unable to complete social registration.",
                        errors = createResult.Errors.Select(e => e.Description)
                    });
                }

                isNewUser = true;
            }
        }

        if (!isNewUser)
        {
            user.LastLoginAt = DateTime.UtcNow;
            updateRequired = true;
        }

        if (updateRequired && !isNewUser)
        {
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                _logger.LogError("Failed to update user during social login eventType={EventType} provider={Provider} emailHash={EmailHash} errors={Errors}",
                    "auth.social_login_failed",
                    providerKey,
                    emailHash,
                    string.Join(",", updateResult.Errors.Select(e => e.Code)));
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Unable to update account for social login.",
                    errors = updateResult.Errors.Select(e => e.Description)
                });
            }
        }

        if (isNewUser)
        {
            try
            {
                await _emailService.SendWelcomeEmailAsync(user.Email!, user.UserName!);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send welcome email for social registration emailHash={EmailHash}", emailHash);
            }
        }

        _logger.LogInformation("Successful social login eventType={EventType} provider={Provider} emailHash={EmailHash}",
            "auth.social_login_success",
            providerKey,
            emailHash);

        var token = _tokenService.GenerateJwtToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        var response = new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                Username = user.UserName ?? socialUser.Email,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                Provider = string.IsNullOrWhiteSpace(user.Provider) ? socialUser.Provider : user.Provider
            }
        };

        return Ok(response);
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var emailToken = await _context.EmailVerificationTokens
            .FirstOrDefaultAsync(t => t.Token == request.Token && !t.IsUsed);

        if (emailToken == null || emailToken.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Invalid or expired verification token" });
        }

        // Fetch the user separately to avoid tracking conflicts
        var user = await _userManager.FindByIdAsync(emailToken.UserId.ToString());
        
        if (user == null)
        {
            // User was deleted (possibly during re-registration)
            return BadRequest(new { message = "Invalid or expired verification token" });
        }
        
        if (user.EmailConfirmed)
        {
            // User is already verified
            return Ok(new { message = "Email already verified" });
        }

        // Mark user as verified
        user.EmailConfirmed = true;
        var updateResult = await _userManager.UpdateAsync(user);
        
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { message = "Failed to verify email" });
        }
        
        // Mark token as used
        emailToken.IsUsed = true;
        emailToken.UsedAt = DateTime.UtcNow;
        
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            // Token was deleted (race condition during re-registration)
            // But user was already verified above, so this is fine
            // Just don't send welcome email twice
            if (user.EmailConfirmed)
            {
                return Ok(new { message = "Email verified successfully" });
            }
            throw;
        }

        await _emailService.SendWelcomeEmailAsync(user.Email!, user.UserName!);

        return Ok(new { message = "Email verified successfully" });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        
        if (user == null)
        {
            // Don't reveal that the user doesn't exist
            return Ok(new { message = "If your email is registered, you will receive a password reset link" });
        }

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var frontendUrl = _configuration["FrontendUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var encodedToken = Uri.EscapeDataString(resetToken);
        var resetLink = $"{frontendUrl}/reset-password?token={encodedToken}";
        
        await _emailService.SendPasswordResetAsync(user.Email!, resetLink);

        return Ok(new { message = "If your email is registered, you will receive a password reset link" });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        // The token contains the user information encoded by Identity
        // We need to validate it by attempting to reset the password for each user
        // This is not ideal but Identity doesn't provide a way to extract user from token
        
        // Try to find users and validate token
        var users = await _userManager.Users.ToListAsync();
        User? targetUser = null;
        
        foreach (var user in users)
        {
            // Check if this token is valid for this user
            var isValidToken = await _userManager.VerifyUserTokenAsync(
                user, 
                _userManager.Options.Tokens.PasswordResetTokenProvider,
                UserManager<User>.ResetPasswordTokenPurpose,
                request.Token
            );
            
            if (isValidToken)
            {
                targetUser = user;
                break;
            }
        }
        
        if (targetUser == null)
        {
            return BadRequest(new { message = "Invalid or expired reset token" });
        }

        var result = await _userManager.ResetPasswordAsync(targetUser, request.Token, request.NewPassword);
        
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new { message = "Password reset successfully" });
    }

    [HttpPost("resend-verification-email")]
    public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationEmailRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        
        if (user == null)
        {
            // Don't reveal that the user doesn't exist
            return Ok(new { message = "If your email is registered, you will receive a verification email" });
        }

        if (user.EmailConfirmed)
        {
            return BadRequest(new { message = "Email is already verified" });
        }

        // Invalidate any existing verification tokens for this user
        var existingTokens = await _context.EmailVerificationTokens
            .Where(t => t.UserId == user.Id && !t.IsUsed)
            .ToListAsync();
        
        foreach (var token in existingTokens)
        {
            token.IsUsed = true;
        }

        // Generate new verification token
        var verificationToken = _tokenService.GenerateEmailVerificationToken();
        var emailToken = new EmailVerificationToken
        {
            UserId = user.Id,
            Email = user.Email!,
            Token = verificationToken,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsUsed = false
        };
        
        _context.EmailVerificationTokens.Add(emailToken);
        await _context.SaveChangesAsync();

        // Send verification email
        var frontendUrl = _configuration["FrontendUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var encodedToken = Uri.EscapeDataString(verificationToken);
        var verificationLink = $"{frontendUrl}/verify-email?token={encodedToken}";
        await _emailService.SendEmailVerificationAsync(user.Email!, verificationLink);

        return Ok(new { message = "Verification email sent successfully" });
    }

    private static string HashIdentifier(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "unknown";
        }

        var normalized = value.Trim().ToLowerInvariant();
        var bytes = Encoding.UTF8.GetBytes(normalized);
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexString(hashBytes.AsSpan(0, 8));
    }

    private UserRole ResolveRoleFromEmail(string email)
    {
        if (email.Equals("admin@antystyki.pl", StringComparison.OrdinalIgnoreCase))
        {
            return UserRole.Admin;
        }

        if (email.Equals("tmierzejowski@gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            return UserRole.Moderator;
        }

        return UserRole.User;
    }

    private async Task<string> GenerateUniqueUsernameAsync(string? fullName, string email, CancellationToken cancellationToken)
    {
        var baseName = !string.IsNullOrWhiteSpace(fullName)
            ? fullName.ToLowerInvariant()
            : email.Split('@', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault() ?? "user";

        baseName = Regex.Replace(baseName, "[^a-z0-9]", string.Empty);

        if (string.IsNullOrWhiteSpace(baseName))
        {
            baseName = "user";
        }

        if (baseName.Length > 20)
        {
            baseName = baseName[..20];
        }

        var candidate = baseName;
        var suffix = 0;

        while (!cancellationToken.IsCancellationRequested &&
               await _userManager.FindByNameAsync(candidate) is not null)
        {
            suffix++;
            candidate = $"{baseName}{suffix}";
            if (candidate.Length > 30)
            {
                candidate = candidate[..30];
            }
        }

        return candidate;
    }
}


