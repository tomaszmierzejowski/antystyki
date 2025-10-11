namespace Antystics.Core.Entities;

public class AntisticReport
{
    public Guid Id { get; set; }
    public string Reason { get; set; } = string.Empty;
    public ReportStatus Status { get; set; } = ReportStatus.Pending;
    public string? Resolution { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    
    // Foreign keys
    public Guid AntisticId { get; set; }
    public Guid ReportedByUserId { get; set; }
    public Guid? ResolvedByUserId { get; set; }
    
    // Navigation properties
    public virtual Antistic Antistic { get; set; } = null!;
    public virtual User ReportedBy { get; set; } = null!;
    public virtual User? ResolvedBy { get; set; }
}

public enum ReportStatus
{
    Pending = 0,
    Reviewing = 1,
    Resolved = 2,
    Dismissed = 3
}


