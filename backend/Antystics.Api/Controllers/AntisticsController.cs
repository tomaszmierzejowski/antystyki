using System.Security.Claims;
using Antystics.Api.DTOs;
using Antystics.Core.Entities;
using Antystics.Core.Interfaces;
using Antystics.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AntisticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;

    public AntisticsController(ApplicationDbContext context, IImageService imageService)
    {
        _context = context;
        _imageService = imageService;
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

        var currentUserId = GetCurrentUserId();
        var likedAntisticIds = currentUserId.HasValue
            ? await _context.AntisticLikes
                .Where(l => l.UserId == currentUserId.Value && items.Select(a => a.Id).Contains(l.AntisticId))
                .Select(l => l.AntisticId)
                .ToListAsync()
            : new List<Guid>();

        var result = new AntisticListDto
        {
            Items = items.Select(a => MapToDto(a, likedAntisticIds.Contains(a.Id))).ToList(),
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

        return Ok(MapToDto(antistic, isLiked));
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
    [HttpPost("{id}/like")]
    public async Task<IActionResult> LikeAntistic(Guid id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var existingLike = await _context.AntisticLikes
            .FirstOrDefaultAsync(l => l.AntisticId == id && l.UserId == userId.Value);

        if (existingLike != null)
        {
            return BadRequest(new { message = "Already liked" });
        }

        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic == null)
        {
            return NotFound();
        }

        var like = new AntisticLike
        {
            AntisticId = id,
            UserId = userId.Value
        };

        _context.AntisticLikes.Add(like);
        antistic.LikesCount++;
        await _context.SaveChangesAsync();

        return Ok(new { likesCount = antistic.LikesCount });
    }

    [Authorize]
    [HttpDelete("{id}/like")]
    public async Task<IActionResult> UnlikeAntistic(Guid id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var like = await _context.AntisticLikes
            .FirstOrDefaultAsync(l => l.AntisticId == id && l.UserId == userId.Value);

        if (like == null)
        {
            return BadRequest(new { message = "Not liked" });
        }

        var antistic = await _context.Antistics.FindAsync(id);
        if (antistic == null)
        {
            return NotFound();
        }

        _context.AntisticLikes.Remove(like);
        antistic.LikesCount--;
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

    private AntisticDto MapToDto(Antistic antistic, bool isLiked)
    {
        return new AntisticDto
        {
            Id = antistic.Id,
            Title = antistic.Title,
            ReversedStatistic = antistic.ReversedStatistic,
            SourceUrl = antistic.SourceUrl,
            ImageUrl = antistic.ImageUrl,
            Status = antistic.Status.ToString(),
            LikesCount = antistic.LikesCount,
            ViewsCount = antistic.ViewsCount,
            IsLikedByCurrentUser = isLiked,
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
}


