namespace Antystics.Core.Entities;

public class AntisticLike
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Foreign keys
    public Guid AntisticId { get; set; }
    public Guid UserId { get; set; }
    
    // Navigation properties
    public virtual Antistic Antistic { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}


