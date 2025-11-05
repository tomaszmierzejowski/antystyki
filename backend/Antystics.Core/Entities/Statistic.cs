namespace Antystics.Core.Entities;

public class Statistic
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SourceUrl { get; set; } = string.Empty;
    public string? SourceCitation { get; set; }
    public string? ChartData { get; set; }
    public ModerationStatus Status { get; set; } = ModerationStatus.Pending;
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public int TrustPoints { get; set; }
    public int FakePoints { get; set; }
    public int ViewsCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
    public DateTime? ModeratedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? ModeratedByUserId { get; set; }
    public Guid? ConvertedAntisticId { get; set; }
    public string? ModeratorNotes { get; set; }

    public virtual User CreatedBy { get; set; } = null!;
    public virtual User? ModeratedBy { get; set; }
    public virtual Antistic? ConvertedAntistic { get; set; }
    public virtual ICollection<StatisticVote> Votes { get; set; } = new List<StatisticVote>();
}

