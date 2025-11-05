namespace Antystics.Core.Entities;

public class StatisticVote
{
    public Guid Id { get; set; }
    public StatisticVoteType VoteType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid StatisticId { get; set; }
    public Guid UserId { get; set; }

    public virtual Statistic Statistic { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}

public enum StatisticVoteType
{
    Like = 0,
    Dislike = 1,
    Trust = 2,
    Fake = 3
}

