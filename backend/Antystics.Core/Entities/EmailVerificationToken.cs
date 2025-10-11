namespace Antystics.Core.Entities;

public class EmailVerificationToken
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime? UsedAt { get; set; }
    
    // Foreign key
    public Guid UserId { get; set; }
    
    // Navigation property
    public virtual User User { get; set; } = null!;
}


