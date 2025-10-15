using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminModerationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "HiddenAt",
                table: "Antistics",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "HiddenByUserId",
                table: "Antistics",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Antistics_HiddenAt",
                table: "Antistics",
                column: "HiddenAt");

            migrationBuilder.CreateIndex(
                name: "IX_Antistics_HiddenByUserId",
                table: "Antistics",
                column: "HiddenByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Antistics_AspNetUsers_HiddenByUserId",
                table: "Antistics",
                column: "HiddenByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Antistics_AspNetUsers_HiddenByUserId",
                table: "Antistics");

            migrationBuilder.DropIndex(
                name: "IX_Antistics_HiddenAt",
                table: "Antistics");

            migrationBuilder.DropIndex(
                name: "IX_Antistics_HiddenByUserId",
                table: "Antistics");

            migrationBuilder.DropColumn(
                name: "HiddenAt",
                table: "Antistics");

            migrationBuilder.DropColumn(
                name: "HiddenByUserId",
                table: "Antistics");
        }
    }
}
