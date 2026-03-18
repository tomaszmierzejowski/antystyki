using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class HardenContentGenerationPipeline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GenerationKey",
                table: "Statistics",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProvenanceData",
                table: "Statistics",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GenerationKey",
                table: "Antistics",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "content_generation_runs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Trigger = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    DryRun = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RequestedBy = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    RequestedStatistics = table.Column<int>(type: "integer", nullable: false),
                    RequestedAntystics = table.Column<int>(type: "integer", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedStatisticsCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAntysticsCount = table.Column<int>(type: "integer", nullable: false),
                    DuplicateCount = table.Column<int>(type: "integer", nullable: false),
                    SourceFailureCount = table.Column<int>(type: "integer", nullable: false),
                    ValidationFailureCount = table.Column<int>(type: "integer", nullable: false),
                    ValidationIssuesJson = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    SourceIdsCsv = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_content_generation_runs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Statistics_GenerationKey",
                table: "Statistics",
                column: "GenerationKey",
                unique: true,
                filter: "\"GenerationKey\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Antistics_GenerationKey",
                table: "Antistics",
                column: "GenerationKey",
                unique: true,
                filter: "\"GenerationKey\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_content_generation_runs_CreatedAt",
                table: "content_generation_runs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_content_generation_runs_Status",
                table: "content_generation_runs",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "content_generation_runs");

            migrationBuilder.DropIndex(
                name: "IX_Statistics_GenerationKey",
                table: "Statistics");

            migrationBuilder.DropIndex(
                name: "IX_Antistics_GenerationKey",
                table: "Antistics");

            migrationBuilder.DropColumn(
                name: "GenerationKey",
                table: "Statistics");

            migrationBuilder.DropColumn(
                name: "ProvenanceData",
                table: "Statistics");

            migrationBuilder.DropColumn(
                name: "GenerationKey",
                table: "Antistics");
        }
    }
}
