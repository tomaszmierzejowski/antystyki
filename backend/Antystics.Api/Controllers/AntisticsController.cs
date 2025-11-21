using System.Security.Claims;
using Antystics.Api.DTOs;
using Antystics.Api.Utilities;
using Antystics.Core.Entities;
using Antystics.Core.Interfaces;
using Antystics.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AntisticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;
    private readonly IConfiguration _configuration;

    public AntisticsController(ApplicationDbContext context, IImageService imageService, IConfiguration configuration)
    {
        _context = context;
        _imageService = imageService;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> GetAntistics(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null)
    {
        var query = _context.Antistics
            .Include(a => a.User)
            .Include(a => a.Categories)
            .ThenInclude(ac => ac.Category)
            .Where(a => a.Status == ModerationStatus.Approved);

        // Check if user is admin/moderator to see hidden content
        var currentUserId = GetCurrentUserId();
        var isAdmin = currentUserId.HasValue && 
            await _context.Users.AnyAsync(u => u.Id == currentUserId.Value && 
                (u.Role == UserRole.Admin || u.Role == UserRole.Moderator));

        // Hide content from regular users, but show to admins/moderators
        if (!isAdmin)
        {
            query = query.Where(a => a.HiddenAt == null);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(a => a.Title.Contains(search) || a.ReversedStatistic.Contains(search));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(a => a.Categories.Any(c => c.CategoryId == categoryId.Value));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.PublishedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        var likedAntisticIds = currentUserId.HasValue
            ? await _context.AntisticLikes
                .Where(l => l.UserId == currentUserId.Value && items.Select(a => a.Id).Contains(l.AntisticId))
                .Select(l => l.AntisticId)
                .ToListAsync()
            : new List<Guid>();

        var frontendBaseUrl = GetFrontendBaseUrl();

        var result = new AntisticListDto
        {
            Items = items.Select(a => MapToDto(a, likedAntisticIds.Contains(a.Id), frontendBaseUrl)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAntistic(Guid id)
    {
        var antistic = await _context.Antistics
            .Include(a => a.User)
            .Include(a => a.Categories)
            .ThenInclude(ac => ac.Category)
            .FirstOrDefaultAsync(a => a.Id == id && a.Status == ModerationStatus.Approved);

        if (antistic == null)
        {
            return NotFound();
        }

        // Increment view count
        antistic.ViewsCount++;
        await _context.SaveChangesAsync();

        var currentUserId = GetCurrentUserId();
        var isLiked = currentUserId.HasValue &&
            await _context.AntisticLikes.AnyAsync(l => l.AntisticId == id && l.UserId == currentUserId.Value);

        return Ok(MapToDto(antistic, isLiked, GetFrontendBaseUrl()));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateAntistic([FromBody] CreateAntisticRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        // TODO: Generate image with watermark
        var imageUrl = "/placeholder.png"; // Placeholder for now

        var antistic = new Antistic
        {
            Title = request.Title,
            ReversedStatistic = request.ReversedStatistic,
            SourceUrl = request.SourceUrl,
            ImageUrl = imageUrl,
            BackgroundImageKey = request.BackgroundImageKey,
            TemplateId = request.TemplateId,
            ChartData = request.ChartData != null ? System.Text.Json.JsonSerializer.Serialize(request.ChartData) : null,
            UserId = userId.Value,
            Status = ModerationStatus.Pending
        };

        _context.Antistics.Add(antistic);
        await _context.SaveChangesAsync();

        // Add categories
        foreach (var categoryId in request.CategoryIds)
        {
            _context.AntisticCategories.Add(new AntisticCategory
            {
                AntisticId = antistic.Id,
                CategoryId = categoryId
            });
        }
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAntistic), new { id = antistic.Id }, new { id = antistic.Id });
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAntistic(Guid id, [FromBody] UpdateAntisticRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var antistic = await _context.Antistics
            .Include(a => a.Categories)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (antistic == null)
        {
            return NotFound();
        }

        var isAdminOrMod = User.IsInRole("Admin") || User.IsInRole("Moderator");
        
        // Check permissions
        if (antistic.UserId != userId.Value && !isAdminOrMod)
        {
            return Forbid();
        }

        // Logic for Admin/Moderator: Direct update
        if (isAdminOrMod)
        {
            UpdateAntisticFields(antistic, request);
            
            // If moderator updates it, we publish it instantly
            if (antistic.Status != ModerationStatus.Approved)
            {
                antistic.Status = ModerationStatus.Approved;
                if (!antistic.PublishedAt.HasValue)
                {
                    antistic.PublishedAt = DateTime.UtcNow;
                }
                antistic.ModeratedAt = DateTime.UtcNow;
                antistic.ModeratedByUserId = userId.Value;
            }

            await _context.SaveChangesAsync();
            return Ok(MapToDto(antistic, false, GetFrontendBaseUrl()));
        }

        // Logic for Creator
        if (antistic.Status == ModerationStatus.Approved)
        {
            // Create a DRAFT (New Antistic)
            var draft = new Antistic
            {
                Title = request.Title,
                ReversedStatistic = request.ReversedStatistic,
                SourceUrl = request.SourceUrl,
                ImageUrl = antistic.ImageUrl,
                BackgroundImageKey = request.BackgroundImageKey ?? antistic.BackgroundImageKey,
                TemplateId = request.TemplateId ?? antistic.TemplateId,
                ChartData = request.ChartData != null ? System.Text.Json.JsonSerializer.Serialize(request.ChartData) : antistic.ChartData,
                UserId = userId.Value,
                Status = ModerationStatus.Pending,
                OriginalAntisticId = antistic.Id,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.Antistics.Add(draft);
            await _context.SaveChangesAsync();
            
            // Add categories
            foreach (var categoryId in request.CategoryIds)
            {
                _context.AntisticCategories.Add(new AntisticCategory
                {
                    AntisticId = draft.Id,
                    CategoryId = categoryId
                });
            }
            await _context.SaveChangesAsync();

            return Ok(new { message = "Changes sent to moderation", draftId = draft.Id });
        }
        else
        {
            // Update existing (Pending/Rejected/Draft)
            UpdateAntisticFields(antistic, request);
            
            // Reset status to Pending if it was Rejected
            antistic.Status = ModerationStatus.Pending;
            antistic.RejectionReason = null;
            
            await _context.SaveChangesAsync();
            return Ok(MapToDto(antistic, false, GetFrontendBaseUrl()));
        }
    }

    private void UpdateAntisticFields(Antistic antistic, UpdateAntisticRequest request)
    {
        antistic.Title = request.Title;
        antistic.ReversedStatistic = request.ReversedStatistic;
        antistic.SourceUrl = request.SourceUrl;
        
        if (request.BackgroundImageKey != null)
            antistic.BackgroundImageKey = request.BackgroundImageKey;
            
        if (request.TemplateId != null)
            antistic.TemplateId = request.TemplateId;
            
        if (request.ChartData != null)
            antistic.ChartData = System.Text.Json.JsonSerializer.Serialize(request.ChartData);

        // Update categories
        // Remove existing
        var existingCategories = _context.AntisticCategories.Where(c => c.AntisticId == antistic.Id);
        _context.AntisticCategories.RemoveRange(existingCategories);
        
        // Add new
        foreach (var categoryId in request.CategoryIds)
        {
            _context.AntisticCategories.Add(new AntisticCategory
            {
                AntisticId = antistic.Id,
                CategoryId = categoryId
            });
        }
    }

    [HttpPost("{id}/like")]
    public async Task<IActionResult> LikeAntistic(Guid id)
    {
        var userId = GetCurrentUserId();
        var anonymousUserId = Request.Headers["X-Anonymous-User-Id"].FirstOrDefault();

        // Check if user is authenticated or anonymous
        if (!userId.HasValue && string.IsNullOrEmpty(anonymousUserId))
        {
            return Unauthorized(new { message = "User identification required" });
        }

        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic == null)
        {
            return NotFound();
        }

        if (userId.HasValue)
        {
            // Authenticated user - store like in database
            var existingLike = await _context.AntisticLikes
                .FirstOrDefaultAsync(l => l.AntisticId == id && l.UserId == userId.Value);

            if (existingLike != null)
            {
                return BadRequest(new { message = "Already liked" });
            }

            var like = new AntisticLike
            {
                AntisticId = id,
                UserId = userId.Value
            };

            _context.AntisticLikes.Add(like);
        }
        
        // For both authenticated and anonymous: increment counter
        // Anonymous likes are tracked client-side to prevent duplicates
        antistic.LikesCount++;
        await _context.SaveChangesAsync();

        return Ok(new { likesCount = antistic.LikesCount });
    }

    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic == null)
        {
            return NotFound();
        }

        var totalCount = await _context.AntisticComments
            .Where(c => c.AntisticId == id && c.DeletedAt == null)
            .CountAsync();

        var comments = await _context.AntisticComments
            .Where(c => c.AntisticId == id && c.DeletedAt == null)
            .Include(c => c.User)
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new CommentListDto
        {
            Items = comments.Select(MapCommentToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(result);
    }

    [Authorize]
    [HttpPost("{id}/comments")]
    public async Task<IActionResult> CreateComment(Guid id, [FromBody] CreateCommentRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Content) || request.Content.Length > 2000)
        {
            return BadRequest(new { message = "Content must be between 1 and 2000 characters" });
        }

        var comment = new AntisticComment
        {
            AntisticId = id,
            UserId = userId.Value,
            Content = request.Content.Trim()
        };

        _context.AntisticComments.Add(comment);
        antistic.CommentsCount++;
        await _context.SaveChangesAsync();

        // Reload with user data
        await _context.Entry(comment).Reference(c => c.User).LoadAsync();

        return CreatedAtAction(nameof(GetComments), new { id }, MapCommentToDto(comment));
    }

    [Authorize]
    [HttpDelete("{id}/comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(Guid id, Guid commentId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var comment = await _context.AntisticComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.AntisticId == id && c.DeletedAt == null);

        if (comment == null)
        {
            return NotFound();
        }

        // Only allow owner to delete
        if (comment.UserId != userId.Value)
        {
            return Forbid();
        }

        comment.DeletedAt = DateTime.UtcNow;
        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic != null)
        {
            antistic.CommentsCount--;
        }
        await _context.SaveChangesAsync();

        return Ok(new { message = "Comment deleted successfully" });
    }

    [Authorize(Roles = "Admin,Moderator")]
    [HttpPost("{id}/hide")]
    public async Task<IActionResult> HideAntistic(Guid id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic == null)
        {
            return NotFound();
        }

        antistic.HiddenAt = DateTime.UtcNow;
        antistic.HiddenByUserId = userId.Value;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Antistic hidden successfully" });
    }

    [Authorize(Roles = "Admin,Moderator")]
    [HttpPost("{id}/unhide")]
    public async Task<IActionResult> UnhideAntistic(Guid id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic == null)
        {
            return NotFound();
        }

        antistic.HiddenAt = null;
        antistic.HiddenByUserId = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Antistic unhidden successfully" });
    }

    [Authorize(Roles = "Admin,Moderator")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAntistic(Guid id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic == null)
        {
            return NotFound();
        }

        _context.Antistics.Remove(antistic);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Antistic deleted successfully" });
    }

    [Authorize(Roles = "Admin,Moderator")]
    [HttpDelete("{antisticId}/comments/{commentId}/admin")]
    public async Task<IActionResult> AdminDeleteComment(Guid antisticId, Guid commentId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var comment = await _context.AntisticComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.AntisticId == antisticId && c.DeletedAt == null);

        if (comment == null)
        {
            return NotFound();
        }

        comment.DeletedAt = DateTime.UtcNow;
        var antistic = await _context.Antistics.FindAsync(antisticId);
        if (antistic != null)
        {
            antistic.CommentsCount--;
        }
        await _context.SaveChangesAsync();

        return Ok(new { message = "Comment deleted by admin successfully" });
    }

    [HttpDelete("{id}/like")]
    public async Task<IActionResult> UnlikeAntistic(Guid id)
    {
        var userId = GetCurrentUserId();
        var anonymousUserId = Request.Headers["X-Anonymous-User-Id"].FirstOrDefault();

        // Check if user is authenticated or anonymous
        if (!userId.HasValue && string.IsNullOrEmpty(anonymousUserId))
        {
            return Unauthorized(new { message = "User identification required" });
        }

        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic == null)
        {
            return NotFound();
        }

        if (userId.HasValue)
        {
            // Authenticated user - remove like from database
            var like = await _context.AntisticLikes
                .FirstOrDefaultAsync(l => l.AntisticId == id && l.UserId == userId.Value);

            if (like == null)
            {
                return BadRequest(new { message = "Not liked" });
            }

            _context.AntisticLikes.Remove(like);
        }
        
        // For both authenticated and anonymous: decrement counter
        // Anonymous unlikes are tracked client-side
        if (antistic.LikesCount > 0)
        {
            antistic.LikesCount--;
        }
        
        await _context.SaveChangesAsync();

        return Ok(new { likesCount = antistic.LikesCount });
    }

    [Authorize]
    [HttpPost("{id}/report")]
    public async Task<IActionResult> ReportAntistic(Guid id, [FromBody] ReportAntisticRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic == null)
        {
            return NotFound();
        }

        var report = new AntisticReport
        {
            AntisticId = id,
            ReportedByUserId = userId.Value,
            Reason = request.Reason,
            Status = ReportStatus.Pending
        };

        _context.AntisticReports.Add(report);
        antistic.ReportsCount++;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Report submitted successfully" });
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null ? Guid.Parse(userIdClaim) : null;
    }

    private AntisticDto MapToDto(Antistic antistic, bool isLiked, string frontendBaseUrl)
    {
        return new AntisticDto
        {
            Id = antistic.Id,
            Title = antistic.Title,
            ReversedStatistic = antistic.ReversedStatistic,
            SourceUrl = antistic.SourceUrl,
            ImageUrl = antistic.ImageUrl,
            Slug = UrlBuilder.GenerateSlug(antistic.Title, "antystyk"),
            CanonicalUrl = UrlBuilder.BuildCanonicalUrl(frontendBaseUrl, "antistics", antistic.Id, antistic.Title),
            TemplateId = antistic.TemplateId,
            ChartData = !string.IsNullOrEmpty(antistic.ChartData) ? System.Text.Json.JsonSerializer.Deserialize<object>(antistic.ChartData) : null,
            Status = antistic.Status.ToString(),
            LikesCount = antistic.LikesCount,
            ViewsCount = antistic.ViewsCount,
            CommentsCount = antistic.CommentsCount,
            IsLikedByCurrentUser = isLiked,
            HiddenAt = antistic.HiddenAt,
            CreatedAt = antistic.CreatedAt,
            PublishedAt = antistic.PublishedAt,
            User = new UserDto
            {
                Id = antistic.User.Id,
                Email = antistic.User.Email!,
                Username = antistic.User.UserName!,
                Role = antistic.User.Role.ToString(),
                CreatedAt = antistic.User.CreatedAt
            },
            Categories = antistic.Categories.Select(ac => new CategoryDto
            {
                Id = ac.Category.Id,
                NamePl = ac.Category.NamePl,
                NameEn = ac.Category.NameEn,
                Slug = ac.Category.Slug
            }).ToList()
        };
    }

    private string GetFrontendBaseUrl()
    {
        var configured = _configuration["FrontendUrl"];
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured!.TrimEnd('/');
        }

        if (Request?.Scheme is { Length: > 0 } scheme && Request.Host.HasValue)
        {
            return $"{scheme}://{Request.Host}".TrimEnd('/');
        }

        return "https://antystyki.pl";
    }

    private CommentDto MapCommentToDto(AntisticComment comment)
    {
        return new CommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            User = new UserDto
            {
                Id = comment.User.Id,
                Email = comment.User.Email!,
                Username = comment.User.UserName!,
                Role = comment.User.Role.ToString(),
                CreatedAt = comment.User.CreatedAt
            }
        };
    }
}


