namespace Antystics.Core.Interfaces;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string verificationLink);
    Task SendPasswordResetAsync(string email, string resetLink);
    Task SendWelcomeEmailAsync(string email, string username);
    Task SendContactFormAsync(string name, string email, string subject, string message);
}


