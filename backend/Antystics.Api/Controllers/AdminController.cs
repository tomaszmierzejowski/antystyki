using System.Security.Claims;
using Antystics.Api.DTOs;
using Antystics.Api.Utilities;
using Antystics.Core.Entities;
using Antystics.Core.Interfaces;
using Antystics.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Antystics.Api.Controllers;

[Authorize(Roles = "Admin,Moderator")]
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    public AdminController(ApplicationDbContext context, UserManager<User> userManager, IConfiguration configuration, IEmailService emailService)
    {
        _context = context;
        _userManager = userManager;
        _configuration = configuration;
        _emailService = emailService;
    }

    [HttpGet("antistics/pending")]
    public async Task<IActionResult> GetPendingAntistics([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.Antistics
            .Include(a => a.User)
            .Include(a => a.Categories)
            .ThenInclude(ac => ac.Category)
            .Where(a => a.Status == ModerationStatus.Pending)
            .OrderBy(a => a.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new AntisticListDto
        {
            Items = items.Select(a => MapToDto(a)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(result);
    }

    [HttpGet("statistics/pending")]
    public async Task<IActionResult> GetPendingStatistics([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.Statistics
            .Include(s => s.CreatedBy)
            .Where(s => s.Status == ModerationStatus.Pending)
            .OrderBy(s => s.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new StatisticListDto
        {
            Items = items.Select(s => MapStatisticToDto(s)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(result);
    }

    [HttpPost("antistics/{id}/moderate")]
    public async Task<IActionResult> ModerateAntistic(Guid id, [FromBody] ModerateAntisticRequest request)
    {
        var antistic = await _context.Antistics
            .Include(a => a.User)
            .Include(a => a.Categories)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (antistic == null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        if (request.Approve)
        {
            // Check if this is an update to an existing antistic
            if (antistic.OriginalAntisticId.HasValue)
            {
                var original = await _context.Antistics
                    .Include(a => a.Categories)
                    .FirstOrDefaultAsync(a => a.Id == antistic.OriginalAntisticId.Value);

                if (original != null)
                {
                    // Update original with values from draft
                    original.Title = antistic.Title;
                    original.ReversedStatistic = antistic.ReversedStatistic;
                    original.SourceUrl = antistic.SourceUrl;
                    original.BackgroundImageKey = antistic.BackgroundImageKey;
                    original.TemplateId = antistic.TemplateId;
                    original.ChartData = antistic.ChartData;
                    // If image was regenerated for draft, update it. If not, keep original? 
                    // Assuming draft has valid image.
                    if (!string.IsNullOrEmpty(antistic.ImageUrl))
                        original.ImageUrl = antistic.ImageUrl;

                    // Update categories
                    var existingCategories = _context.AntisticCategories.Where(c => c.AntisticId == original.Id);
                    _context.AntisticCategories.RemoveRange(existingCategories);
                    
                    foreach (var cat in antistic.Categories)
                    {
                        _context.AntisticCategories.Add(new AntisticCategory
                        {
                            AntisticId = original.Id,
                            CategoryId = cat.CategoryId
                        });
                    }

                    original.ModeratedAt = DateTime.UtcNow;
                    original.ModeratedByUserId = userId.Value;

                    // Remove the draft
                    _context.Antistics.Remove(antistic);
                    
                    await _context.SaveChangesAsync();
                    
                    if (antistic.User?.Email != null)
                    {
                        await _emailService.SendAntisticApprovedAsync(antistic.User.Email, antistic.User.UserName!, original.Title, original.Id.ToString());
                    }
                    
                    return Ok(new { message = "Moderation completed (Merged)" });
                }
            }

            // Normal approval
            antistic.Status = ModerationStatus.Approved;
            antistic.ModeratedAt = DateTime.UtcNow;
            antistic.ModeratedByUserId = userId.Value;
            antistic.PublishedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            if (antistic.User?.Email != null)
            {
                await _emailService.SendAntisticApprovedAsync(antistic.User.Email, antistic.User.UserName!, antistic.Title, antistic.Id.ToString());
            }
        }
        else
        {
            antistic.Status = ModerationStatus.Rejected;
            antistic.RejectionReason = request.RejectionReason;
            antistic.ModeratedAt = DateTime.UtcNow;
            antistic.ModeratedByUserId = userId.Value;
            
            await _context.SaveChangesAsync();

            if (antistic.User?.Email != null)
            {
                await _emailService.SendAntisticRejectedAsync(antistic.User.Email, antistic.User.UserName!, antistic.Title, request.RejectionReason ?? "No reason provided");
            }
        }

        return Ok(new { message = "Moderation completed successfully" });
    }

    [HttpPost("statistics/{id}/moderate")]
    public async Task<IActionResult> ModerateStatistic(Guid id, [FromBody] ModerateStatisticRequest request)
    {
        var statistic = await _context.Statistics.FindAsync(id);
        if (statistic == null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        statistic.Status = request.Approve ? ModerationStatus.Approved : ModerationStatus.Rejected;
        statistic.ModeratorNotes = request.ModeratorNotes;
        statistic.ModeratedAt = DateTime.UtcNow;
        statistic.ModeratedByUserId = userId.Value;

        if (request.Approve)
        {
            statistic.PublishedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Statistic moderation completed successfully" });
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.AntisticReports
            .Include(r => r.Antistic)
            .Include(r => r.ReportedBy)
            .Where(r => r.Status == ReportStatus.Pending || r.Status == ReportStatus.Reviewing)
            .OrderBy(r => r.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { items, totalCount, page, pageSize });
    }

    [HttpPost("reports/{id}/resolve")]
    public async Task<IActionResult> ResolveReport(Guid id, [FromBody] ResolveReportRequest request)
    {
        var report = await _context.AntisticReports.FindAsync(id);
        if (report == null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        report.Status = ReportStatus.Resolved;
        report.Resolution = request.Resolution;
        report.ResolvedAt = DateTime.UtcNow;
        report.ResolvedByUserId = userId.Value;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Report resolved successfully" });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.Users.OrderBy(u => u.CreatedAt);

        var totalCount = await query.CountAsync();
        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = users.Select(u => new UserDto
        {
            Id = u.Id,
            Email = u.Email!,
            Username = u.UserName!,
            Role = u.Role.ToString(),
            CreatedAt = u.CreatedAt
        });

        return Ok(new { items = result, totalCount, page, pageSize });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("users/{id}/role")]
    public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return NotFound();
        }

        if (!Enum.TryParse<UserRole>(request.Role, out var role))
        {
            return BadRequest(new { message = "Invalid role" });
        }

        user.Role = role;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "User role updated successfully" });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("users/{id}/gdpr-export")]
    public async Task<IActionResult> ExportUserData(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Antistics)
            .Include(u => u.Likes)
            .Include(u => u.Reports)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound();
        }

        var data = new
        {
            User = new
            {
                user.Email,
                user.UserName,
                user.CreatedAt,
                user.LastLoginAt
            },
            Antistics = user.Antistics.Select(a => new
            {
                a.Title,
                a.ReversedStatistic,
                a.SourceUrl,
                a.CreatedAt,
                a.Status
            }),
            Likes = user.Likes.Select(l => new { l.AntisticId, l.CreatedAt }),
            Reports = user.Reports.Select(r => new { r.Reason, r.CreatedAt, r.Status })
        };

        return Ok(data);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("users/{id}/gdpr-delete")]
    public async Task<IActionResult> DeleteUserData(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return NotFound();
        }

        // Anonymize user's antistics instead of deleting them
        var antistics = await _context.Antistics.Where(a => a.UserId == id).ToListAsync();
        foreach (var antistic in antistics)
        {
            antistic.UserId = Guid.Empty; // Set to anonymous user
        }

        // Delete user
        await _userManager.DeleteAsync(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User data deleted successfully" });
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null ? Guid.Parse(userIdClaim) : null;
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

    private AntisticDto MapToDto(Antistic antistic)
    {
        var frontendBaseUrl = GetFrontendBaseUrl();

        return new AntisticDto
        {
            Id = antistic.Id,
            OriginalAntisticId = antistic.OriginalAntisticId,
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

    private StatisticDto MapStatisticToDto(Statistic statistic)
    {
        var frontendBaseUrl = GetFrontendBaseUrl();

        return new StatisticDto
        {
            Id = statistic.Id,
            Title = statistic.Title,
            Summary = statistic.Summary,
            Description = statistic.Description,
            SourceUrl = statistic.SourceUrl,
            SourceCitation = statistic.SourceCitation,
            ChartData = !string.IsNullOrEmpty(statistic.ChartData) ? System.Text.Json.JsonSerializer.Deserialize<object>(statistic.ChartData) : null,
            Status = statistic.Status.ToString(),
            Slug = UrlBuilder.GenerateSlug(statistic.Title, "statystyka"),
            CanonicalUrl = UrlBuilder.BuildCanonicalUrl(frontendBaseUrl, "statistics", statistic.Id, statistic.Title),
            LikeCount = statistic.LikeCount,
            DislikeCount = statistic.DislikeCount,
            TrustPoints = statistic.TrustPoints,
            FakePoints = statistic.FakePoints,
            ViewsCount = statistic.ViewsCount,
            HasLiked = false,
            HasDisliked = false,
            CreatedAt = statistic.CreatedAt,
            PublishedAt = statistic.PublishedAt,
            ModeratedAt = statistic.ModeratedAt,
            CreatedByUserId = statistic.CreatedByUserId,
            ConvertedAntisticId = statistic.ConvertedAntisticId,
            CreatedBy = new UserDto
            {
                Id = statistic.CreatedBy.Id,
                Email = statistic.CreatedBy.Email!,
                Username = statistic.CreatedBy.UserName!,
                Role = statistic.CreatedBy.Role.ToString(),
                CreatedAt = statistic.CreatedBy.CreatedAt
            }
        };
    }
}

public class ResolveReportRequest
{
    public string Resolution { get; set; } = string.Empty;
}

public class UpdateUserRoleRequest
{
    public string Role { get; set; } = string.Empty;
}


