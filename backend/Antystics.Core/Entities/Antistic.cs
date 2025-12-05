namespace Antystics.Core.Entities;

public class Antistic
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ReversedStatistic { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? BackgroundImageKey { get; set; }
    public string? TemplateId { get; set; }
    public string? ChartData { get; set; } // JSON string containing chart data
    public ModerationStatus Status { get; set; } = ModerationStatus.Pending;
    public string? RejectionReason { get; set; }
    public int LikesCount { get; set; }
    public int ViewsCount { get; set; }
    public int ReportsCount { get; set; }
    public int CommentsCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
    public DateTime? ModeratedAt { get; set; }
    public DateTime? HiddenAt { get; set; }
    public Guid? HiddenByUserId { get; set; }
    public Guid? OriginalAntisticId { get; set; }
    public Guid? SourceStatisticId { get; set; }
    
    // Foreign keys
    public Guid UserId { get; set; }
    public Guid? ModeratedByUserId { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual User? ModeratedBy { get; set; }
    public virtual User? HiddenBy { get; set; }
    public virtual Antistic? OriginalAntistic { get; set; }
    public virtual Statistic? SourceStatistic { get; set; }
    public virtual ICollection<AntisticLike> Likes { get; set; } = new List<AntisticLike>();
    public virtual ICollection<AntisticReport> Reports { get; set; } = new List<AntisticReport>();
    public virtual ICollection<AntisticComment> Comments { get; set; } = new List<AntisticComment>();
    public virtual ICollection<AntisticCategory> Categories { get; set; } = new List<AntisticCategory>();
}

public enum ModerationStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Flagged = 3
}


