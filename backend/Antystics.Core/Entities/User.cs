using Microsoft.AspNetCore.Identity;

namespace Antystics.Core.Entities;

public class User : IdentityUser<Guid>
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;
    public UserRole Role { get; set; } = UserRole.User;
    
    // Navigation properties
    public virtual ICollection<Antistic> Antistics { get; set; } = new List<Antistic>();
    public virtual ICollection<Statistic> Statistics { get; set; } = new List<Statistic>();
    public virtual ICollection<StatisticVote> StatisticVotes { get; set; } = new List<StatisticVote>();
    public virtual ICollection<AntisticLike> Likes { get; set; } = new List<AntisticLike>();
    public virtual ICollection<AntisticReport> Reports { get; set; } = new List<AntisticReport>();
    public virtual ICollection<AntisticComment> Comments { get; set; } = new List<AntisticComment>();
}

public enum UserRole
{
    User = 0,
    Moderator = 1,
    Admin = 2
}



