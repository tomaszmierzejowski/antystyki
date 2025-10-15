namespace Antystics.Core.Entities;

public class AntisticComment
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    
    // Foreign keys
    public Guid AntisticId { get; set; }
    public Guid UserId { get; set; }
    
    // Navigation properties
    public virtual Antistic Antistic { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
