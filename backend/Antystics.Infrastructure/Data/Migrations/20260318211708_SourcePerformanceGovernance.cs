using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class SourcePerformanceGovernance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SkippedSourcesJson",
                table: "content_generation_runs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourcePerformanceJson",
                table: "content_generation_runs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SkippedSourcesJson",
                table: "content_generation_runs");

            migrationBuilder.DropColumn(
                name: "SourcePerformanceJson",
                table: "content_generation_runs");
        }
    }
}
