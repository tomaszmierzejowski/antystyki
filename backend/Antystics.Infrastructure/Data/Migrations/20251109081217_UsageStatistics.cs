using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UsageStatistics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ga_statistics_AspNetUsers_CreatedByUserId",
                table: "ga_statistics");

            migrationBuilder.DropForeignKey(
                name: "FK_ga_statistics_AspNetUsers_ModeratedByUserId",
                table: "ga_statistics");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ga_statistics");

            migrationBuilder.DropColumn(
                name: "ModeratedByUserId",
                table: "ga_statistics");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "ga_statistics",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModeratedByUserId",
                table: "ga_statistics",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ga_statistics_AspNetUsers_CreatedByUserId",
                table: "ga_statistics",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ga_statistics_AspNetUsers_ModeratedByUserId",
                table: "ga_statistics",
                column: "ModeratedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
