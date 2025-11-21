using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class Edit_Cards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OriginalAntisticId",
                table: "Antistics",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Antistics_OriginalAntisticId",
                table: "Antistics",
                column: "OriginalAntisticId");

            migrationBuilder.AddForeignKey(
                name: "FK_Antistics_Antistics_OriginalAntisticId",
                table: "Antistics",
                column: "OriginalAntisticId",
                principalTable: "Antistics",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Antistics_Antistics_OriginalAntisticId",
                table: "Antistics");

            migrationBuilder.DropIndex(
                name: "IX_Antistics_OriginalAntisticId",
                table: "Antistics");

            migrationBuilder.DropColumn(
                name: "OriginalAntisticId",
                table: "Antistics");
        }
    }
}
