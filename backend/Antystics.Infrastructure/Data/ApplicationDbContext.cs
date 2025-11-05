using Antystics.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Antystics.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Antistic> Antistics { get; set; }
    public DbSet<Statistic> Statistics { get; set; }
    public DbSet<StatisticVote> StatisticVotes { get; set; }
    public DbSet<AntisticLike> AntisticLikes { get; set; }
    public DbSet<AntisticReport> AntisticReports { get; set; }
    public DbSet<AntisticComment> AntisticComments { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<AntisticCategory> AntisticCategories { get; set; }
    public DbSet<EmailVerificationToken> EmailVerificationTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // User configuration
        builder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Antistic configuration
        builder.Entity<Antistic>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.ReversedStatistic).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.SourceUrl).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.User)
                .WithMany(u => u.Antistics)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ModeratedBy)
                .WithMany()
                .HasForeignKey(e => e.ModeratedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // HiddenBy relationship (admin/moderator who hid the antistic)
            entity.HasOne(e => e.HiddenBy)
                .WithMany()
                .HasForeignKey(e => e.HiddenByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.PublishedAt);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.HiddenAt);
        });

        // Statistic configuration
        builder.Entity<Statistic>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Summary).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.Description).HasMaxLength(4000);
            entity.Property(e => e.SourceUrl).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.SourceCitation).HasMaxLength(500);
            entity.Property(e => e.ModeratorNotes).HasMaxLength(2000);
            entity.Property(e => e.ChartData);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.CreatedBy)
                .WithMany(u => u.Statistics)
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ModeratedBy)
                .WithMany()
                .HasForeignKey(e => e.ModeratedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ConvertedAntistic)
                .WithMany()
                .HasForeignKey(e => e.ConvertedAntisticId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.PublishedAt);
            entity.HasIndex(e => e.CreatedAt);
        });

        // StatisticVote configuration
        builder.Entity<StatisticVote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.VoteType).HasConversion<int>();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Statistic)
                .WithMany(s => s.Votes)
                .HasForeignKey(e => e.StatisticId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.StatisticVotes)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.StatisticId, e.UserId, e.VoteType }).IsUnique();
        });

        // AntisticLike configuration
        builder.Entity<AntisticLike>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Antistic)
                .WithMany(a => a.Likes)
                .HasForeignKey(e => e.AntisticId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Likes)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.AntisticId, e.UserId }).IsUnique();
        });

        // AntisticReport configuration
        builder.Entity<AntisticReport>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Reason).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Antistic)
                .WithMany(a => a.Reports)
                .HasForeignKey(e => e.AntisticId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ReportedBy)
                .WithMany(u => u.Reports)
                .HasForeignKey(e => e.ReportedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ResolvedBy)
                .WithMany()
                .HasForeignKey(e => e.ResolvedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Status);
        });

        // AntisticComment configuration
        builder.Entity<AntisticComment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Antistic)
                .WithMany(a => a.Comments)
                .HasForeignKey(e => e.AntisticId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.AntisticId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.AntisticId, e.DeletedAt });
        });

        // Category configuration
        builder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.NamePl).IsRequired().HasMaxLength(100);
            entity.Property(e => e.NameEn).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasIndex(e => e.Slug).IsUnique();
        });

        // AntisticCategory configuration (many-to-many)
        builder.Entity<AntisticCategory>(entity =>
        {
            entity.HasKey(e => new { e.AntisticId, e.CategoryId });

            entity.HasOne(e => e.Antistic)
                .WithMany(a => a.Categories)
                .HasForeignKey(e => e.AntisticId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.Antistics)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // EmailVerificationToken configuration
        builder.Entity<EmailVerificationToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.Token);
            entity.HasIndex(e => new { e.Email, e.IsUsed });
        });
    }
}


