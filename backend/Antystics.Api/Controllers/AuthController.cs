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
    private readonly ApplicationDbContext _context;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ITokenService tokenService,
        IEmailService emailService,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _emailService = emailService;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // TODO: Validate CAPTCHA token
        
        var user = new User
        {
            UserName = request.Username,
            Email = request.Email,
            EmailConfirmed = false
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
        var verificationLink = $"{Request.Scheme}://{Request.Host}/verify-email?token={verificationToken}";
        await _emailService.SendEmailVerificationAsync(user.Email!, verificationLink);

        return Ok(new { message = "Registration successful. Please check your email to verify your account." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        
        if (user == null)
        {
            return Unauthorized(new { message = "Invalid credentials" });
        }

        if (!user.EmailConfirmed)
        {
            return Unauthorized(new { message = "Please verify your email before logging in" });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        
        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Invalid credentials" });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

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
                CreatedAt = user.CreatedAt
            }
        };

        return Ok(response);
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var emailToken = await _context.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == request.Token && !t.IsUsed);

        if (emailToken == null || emailToken.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Invalid or expired verification token" });
        }

        var user = emailToken.User;
        user.EmailConfirmed = true;
        emailToken.IsUsed = true;
        emailToken.UsedAt = DateTime.UtcNow;

        await _userManager.UpdateAsync(user);
        await _context.SaveChangesAsync();

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
        var resetLink = $"{Request.Scheme}://{Request.Host}/reset-password?token={Uri.EscapeDataString(resetToken)}";
        
        await _emailService.SendPasswordResetAsync(user.Email!, resetLink);

        return Ok(new { message = "If your email is registered, you will receive a password reset link" });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync();
        
        if (user == null)
        {
            return BadRequest(new { message = "Invalid reset token" });
        }

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new { message = "Password reset successfully" });
    }
}


