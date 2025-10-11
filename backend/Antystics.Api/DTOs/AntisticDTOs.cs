namespace Antystics.Api.DTOs;

public class CreateAntisticRequest
{
    public string Title { get; set; } = string.Empty;
    public string ReversedStatistic { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;
    public string? BackgroundImageKey { get; set; }
    public List<Guid> CategoryIds { get; set; } = new();
}

public class UpdateAntisticRequest
{
    public string Title { get; set; } = string.Empty;
    public string ReversedStatistic { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;
    public List<Guid> CategoryIds { get; set; } = new();
}

public class AntisticDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ReversedStatistic { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int LikesCount { get; set; }
    public int ViewsCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public UserDto User { get; set; } = null!;
    public List<CategoryDto> Categories { get; set; } = new();
}

public class AntisticListDto
{
    public List<AntisticDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class ModerateAntisticRequest
{
    public bool Approve { get; set; }
    public string? RejectionReason { get; set; }
}

public class ReportAntisticRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class CategoryDto
{
    public Guid Id { get; set; }
    public string NamePl { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}


