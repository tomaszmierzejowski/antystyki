using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class StatisticsCRUD : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "HiddenAt",
                table: "Statistics",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "HiddenByUserId",
                table: "Statistics",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Statistics_HiddenAt",
                table: "Statistics",
                column: "HiddenAt");

            migrationBuilder.CreateIndex(
                name: "IX_Statistics_HiddenByUserId",
                table: "Statistics",
                column: "HiddenByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Statistics_AspNetUsers_HiddenByUserId",
                table: "Statistics",
                column: "HiddenByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Statistics_AspNetUsers_HiddenByUserId",
                table: "Statistics");

            migrationBuilder.DropIndex(
                name: "IX_Statistics_HiddenAt",
                table: "Statistics");

            migrationBuilder.DropIndex(
                name: "IX_Statistics_HiddenByUserId",
                table: "Statistics");

            migrationBuilder.DropColumn(
                name: "HiddenAt",
                table: "Statistics");

            migrationBuilder.DropColumn(
                name: "HiddenByUserId",
                table: "Statistics");
        }
    }
}
