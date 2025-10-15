using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentsSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChartData",
                table: "Antistics",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CommentsCount",
                table: "Antistics",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TemplateId",
                table: "Antistics",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AntisticComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AntisticId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AntisticComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AntisticComments_Antistics_AntisticId",
                        column: x => x.AntisticId,
                        principalTable: "Antistics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AntisticComments_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AntisticComments_AntisticId",
                table: "AntisticComments",
                column: "AntisticId");

            migrationBuilder.CreateIndex(
                name: "IX_AntisticComments_AntisticId_DeletedAt",
                table: "AntisticComments",
                columns: new[] { "AntisticId", "DeletedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AntisticComments_CreatedAt",
                table: "AntisticComments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AntisticComments_UserId",
                table: "AntisticComments",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AntisticComments");

            migrationBuilder.DropColumn(
                name: "ChartData",
                table: "Antistics");

            migrationBuilder.DropColumn(
                name: "CommentsCount",
                table: "Antistics");

            migrationBuilder.DropColumn(
                name: "TemplateId",
                table: "Antistics");
        }
    }
}
