using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class Statistics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Statistics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    SourceUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    SourceCitation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ChartData = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    LikeCount = table.Column<int>(type: "integer", nullable: false),
                    DislikeCount = table.Column<int>(type: "integer", nullable: false),
                    TrustPoints = table.Column<int>(type: "integer", nullable: false),
                    FakePoints = table.Column<int>(type: "integer", nullable: false),
                    ViewsCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModeratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ModeratedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ConvertedAntisticId = table.Column<Guid>(type: "uuid", nullable: true),
                    ModeratorNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Statistics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Statistics_Antistics_ConvertedAntisticId",
                        column: x => x.ConvertedAntisticId,
                        principalTable: "Antistics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Statistics_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Statistics_AspNetUsers_ModeratedByUserId",
                        column: x => x.ModeratedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StatisticVotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VoteType = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    StatisticId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatisticVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StatisticVotes_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StatisticVotes_Statistics_StatisticId",
                        column: x => x.StatisticId,
                        principalTable: "Statistics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Statistics_ConvertedAntisticId",
                table: "Statistics",
                column: "ConvertedAntisticId");

            migrationBuilder.CreateIndex(
                name: "IX_Statistics_CreatedAt",
                table: "Statistics",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Statistics_CreatedByUserId",
                table: "Statistics",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Statistics_ModeratedByUserId",
                table: "Statistics",
                column: "ModeratedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Statistics_PublishedAt",
                table: "Statistics",
                column: "PublishedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Statistics_Status",
                table: "Statistics",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_StatisticVotes_StatisticId_UserId_VoteType",
                table: "StatisticVotes",
                columns: new[] { "StatisticId", "UserId", "VoteType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StatisticVotes_UserId",
                table: "StatisticVotes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StatisticVotes");

            migrationBuilder.DropTable(
                name: "Statistics");
        }
    }
}
