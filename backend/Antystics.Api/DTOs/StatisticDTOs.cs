namespace Antystics.Api.DTOs;

public class StatisticDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SourceUrl { get; set; } = string.Empty;
    public string? SourceCitation { get; set; }
    public object? ChartData { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string CanonicalUrl { get; set; } = string.Empty;
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public int TrustPoints { get; set; }
    public int FakePoints { get; set; }
    public int ViewsCount { get; set; }
    public bool HasLiked { get; set; }
    public bool HasDisliked { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime? ModeratedAt { get; set; }
    public DateTime? HiddenAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? ConvertedAntisticId { get; set; }
    public UserDto CreatedBy { get; set; } = null!;
}

public class StatisticListDto
{
    public List<StatisticDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class StatisticVoteRequest
{
    public string VoteType { get; set; } = string.Empty;
    public bool Remove { get; set; }
}

public class CreateStatisticRequest
{
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SourceUrl { get; set; } = string.Empty;
    public string? SourceCitation { get; set; }
    public object? ChartData { get; set; }
}

public class ModerateStatisticRequest
{
    public bool Approve { get; set; }
    public string? ModeratorNotes { get; set; }
}

