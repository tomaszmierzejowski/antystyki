using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using Antystics.Api.DTOs;
using Antystics.Core.Entities;
using Antystics.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Antystics.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private const int MaxPageSize = 50;
    private readonly ApplicationDbContext _context;

    public StatisticsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetStatistics(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sort = "top")
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _context.Statistics
            .AsNoTracking()
            .Include(s => s.CreatedBy)
            .Where(s => s.Status == ModerationStatus.Approved);

        query = sort switch
        {
            "new" => query.OrderByDescending(s => s.PublishedAt ?? s.CreatedAt),
            "views" => query.OrderByDescending(s => s.ViewsCount)
                               .ThenByDescending(s => s.PublishedAt ?? s.CreatedAt),
            _ => query.OrderByDescending(s => s.LikeCount - s.DislikeCount)
                      .ThenByDescending(s => s.PublishedAt ?? s.CreatedAt)
        };

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var currentUserId = GetCurrentUserId();
        var userVotesLookup = new Dictionary<Guid, List<StatisticVote>>();

        if (currentUserId.HasValue && items.Count > 0)
        {
            var statisticIds = items.Select(s => s.Id).ToList();
            var votes = await _context.StatisticVotes
                .Where(v => v.UserId == currentUserId.Value && statisticIds.Contains(v.StatisticId))
                .ToListAsync();

            userVotesLookup = votes
                .GroupBy(v => v.StatisticId)
                .ToDictionary(g => g.Key, g => g.ToList());
        }

        var result = new StatisticListDto
        {
            Items = items.Select(statistic =>
            {
                var votes = userVotesLookup.TryGetValue(statistic.Id, out var value) ? value : new List<StatisticVote>();
                var hasLiked = votes.Any(v => v.VoteType == StatisticVoteType.Like);
                var hasDisliked = votes.Any(v => v.VoteType == StatisticVoteType.Dislike);
                return MapToDto(statistic, hasLiked, hasDisliked);
            }).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Ok(result);
    }

    [Authorize(Roles = "Admin,Moderator")]
    [HttpPost]
    public async Task<IActionResult> CreateStatistic([FromBody] CreateStatisticRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Summary) || string.IsNullOrWhiteSpace(request.SourceUrl))
        {
            return BadRequest(new { message = "Title, summary, and source URL are required." });
        }

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var statistic = new Statistic
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Summary = request.Summary.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            SourceUrl = request.SourceUrl.Trim(),
            SourceCitation = string.IsNullOrWhiteSpace(request.SourceCitation) ? null : request.SourceCitation.Trim(),
            ChartData = request.ChartData != null ? JsonSerializer.Serialize(request.ChartData) : null,
            Status = ModerationStatus.Pending,
            CreatedByUserId = userId.Value,
            CreatedAt = DateTime.UtcNow,
        };

        _context.Statistics.Add(statistic);
        await _context.SaveChangesAsync();

        await _context.Entry(statistic).Reference(s => s.CreatedBy).LoadAsync();

        return CreatedAtAction(nameof(GetStatistic), new { id = statistic.Id }, MapToDto(statistic, false, false));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStatistic(Guid id)
    {
        var statistic = await _context.Statistics
            .Include(s => s.CreatedBy)
            .FirstOrDefaultAsync(s => s.Id == id && s.Status == ModerationStatus.Approved);

        if (statistic == null)
        {
            return NotFound();
        }

        statistic.ViewsCount++;
        await _context.SaveChangesAsync();

        var currentUserId = GetCurrentUserId();
        var hasLiked = false;
        var hasDisliked = false;

        if (currentUserId.HasValue)
        {
            var votes = await _context.StatisticVotes
                .Where(v => v.UserId == currentUserId.Value && v.StatisticId == id)
                .ToListAsync();

            hasLiked = votes.Any(v => v.VoteType == StatisticVoteType.Like);
            hasDisliked = votes.Any(v => v.VoteType == StatisticVoteType.Dislike);
        }

        return Ok(MapToDto(statistic, hasLiked, hasDisliked));
    }

    [Authorize]
    [HttpPost("{id}/vote")]
    public async Task<IActionResult> Vote(Guid id, [FromBody] StatisticVoteRequest request)
    {
        if (!Enum.TryParse<StatisticVoteType>(request.VoteType, true, out var voteType))
        {
            return BadRequest(new { message = "Invalid vote type" });
        }

        if (voteType != StatisticVoteType.Like && voteType != StatisticVoteType.Dislike)
        {
            return BadRequest(new { message = "Vote type not supported yet" });
        }

        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var statistic = await _context.Statistics.FirstOrDefaultAsync(s => s.Id == id && s.Status == ModerationStatus.Approved);
        if (statistic == null)
        {
            return NotFound();
        }

        var relevantVotes = await _context.StatisticVotes
            .Where(v => v.StatisticId == id && v.UserId == userId.Value &&
                        (v.VoteType == StatisticVoteType.Like || v.VoteType == StatisticVoteType.Dislike))
            .ToListAsync();

        var existingVote = relevantVotes.FirstOrDefault(v => v.VoteType == voteType);
        var oppositeVoteType = voteType == StatisticVoteType.Like ? StatisticVoteType.Dislike : StatisticVoteType.Like;
        var oppositeVote = relevantVotes.FirstOrDefault(v => v.VoteType == oppositeVoteType);

        if (request.Remove)
        {
            if (existingVote != null)
            {
                _context.StatisticVotes.Remove(existingVote);
                if (voteType == StatisticVoteType.Like)
                {
                    statistic.LikeCount = Math.Max(0, statistic.LikeCount - 1);
                }
                else
                {
                    statistic.DislikeCount = Math.Max(0, statistic.DislikeCount - 1);
                }

                await _context.SaveChangesAsync();
            }

            return Ok(new { likeCount = statistic.LikeCount, dislikeCount = statistic.DislikeCount });
        }

        if (existingVote == null)
        {
            _context.StatisticVotes.Add(new StatisticVote
            {
                StatisticId = id,
                UserId = userId.Value,
                VoteType = voteType
            });

            if (voteType == StatisticVoteType.Like)
            {
                statistic.LikeCount++;
            }
            else
            {
                statistic.DislikeCount++;
            }
        }

        if (oppositeVote != null)
        {
            _context.StatisticVotes.Remove(oppositeVote);
            if (oppositeVoteType == StatisticVoteType.Like)
            {
                statistic.LikeCount = Math.Max(0, statistic.LikeCount - 1);
            }
            else
            {
                statistic.DislikeCount = Math.Max(0, statistic.DislikeCount - 1);
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new { likeCount = statistic.LikeCount, dislikeCount = statistic.DislikeCount });
    }

    private StatisticDto MapToDto(Statistic statistic, bool hasLiked, bool hasDisliked)
    {
        return new StatisticDto
        {
            Id = statistic.Id,
            Title = statistic.Title,
            Summary = statistic.Summary,
            Description = statistic.Description,
            SourceUrl = statistic.SourceUrl,
            SourceCitation = statistic.SourceCitation,
            ChartData = !string.IsNullOrEmpty(statistic.ChartData) ? JsonSerializer.Deserialize<object>(statistic.ChartData) : null,
            Status = statistic.Status.ToString(),
            LikeCount = statistic.LikeCount,
            DislikeCount = statistic.DislikeCount,
            TrustPoints = statistic.TrustPoints,
            FakePoints = statistic.FakePoints,
            ViewsCount = statistic.ViewsCount,
            HasLiked = hasLiked,
            HasDisliked = hasDisliked,
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

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null ? Guid.Parse(userIdClaim) : null;
    }
}

