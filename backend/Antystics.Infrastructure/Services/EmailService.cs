using Antystics.Core.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace Antystics.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailVerificationAsync(string email, string verificationLink)
    {
        var subject = "Verify Your Email - Antystyki";
        var body = $@"
            <h2>Welcome to Antystyki!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <a href='{verificationLink}'>Verify Email</a>
            <p>This link will expire in 24 hours.</p>
        ";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetAsync(string email, string resetLink)
    {
        var subject = "Reset Your Password - Antystyki";
        var body = $@"
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href='{resetLink}'>Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        ";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendWelcomeEmailAsync(string email, string username)
    {
        var subject = "Welcome to Antystyki!";
        var body = $@"
            <h2>Welcome, {username}!</h2>
            <p>Thank you for joining Antystyki - where statistics get reversed!</p>
            <p>Start creating your own antistics and share them with the community.</p>
        ";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendAntisticApprovedAsync(string email, string username, string antisticTitle, string antisticId)
    {
        var subject = "Your Antistic has been approved! - Antystyki";
        var link = $"https://antystyki.pl/antistic/{antisticId}";
        var body = $@"
            <h2>Great news, {username}!</h2>
            <p>Your antistic ""{antisticTitle}"" has been approved and is now live.</p>
            <p><a href='{link}'>View your Antistic</a></p>
            <p>Share it with your friends!</p>
        ";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendAntisticRejectedAsync(string email, string username, string antisticTitle, string reason)
    {
        var subject = "Update on your Antistic submission - Antystyki";
        var body = $@"
            <h2>Hello {username},</h2>
            <p>Thank you for submitting your antistic ""{antisticTitle}"".</p>
            <p>Unfortunately, it was not approved for publication at this time.</p>
            <p><strong>Reason:</strong> {reason}</p>
            <p>You can edit your antistic and submit it again.</p>
        ";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendContactFormAsync(string name, string email, string subject, string message)
    {
        var contactEmail = "antystyki@gmail.com";
        var emailSubject = $"[Antystyki Contact] {subject}";
        var body = $@"
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> {name} ({email})</p>
            <p><strong>Subject:</strong> {subject}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p>{message.Replace("\n", "<br />")}</p>
            <hr />
            <p style='color: #666; font-size: 12px;'>
                To reply, send an email to: {email}
            </p>
        ";

        await SendEmailAsync(contactEmail, emailSubject, body);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _configuration["Email:FromName"] ?? "Antystyki",
            _configuration["Email:FromAddress"] ?? "noreply@antystyki.pl"
        ));
        message.To.Add(new MailboxAddress("", toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = htmlBody
        };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            var smtpHost = _configuration["Email:SmtpHost"];
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var smtpUser = _configuration["Email:SmtpUser"];
            var smtpPass = _configuration["Email:SmtpPassword"];

            await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUser, smtpPass);
            await client.SendAsync(message);
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }
}


