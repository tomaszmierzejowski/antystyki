using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSourceStatisticIdToAntistic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SourceStatisticId",
                table: "Antistics",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Antistics_SourceStatisticId",
                table: "Antistics",
                column: "SourceStatisticId");

            migrationBuilder.AddForeignKey(
                name: "FK_Antistics_Statistics_SourceStatisticId",
                table: "Antistics",
                column: "SourceStatisticId",
                principalTable: "Statistics",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Antistics_Statistics_SourceStatisticId",
                table: "Antistics");

            migrationBuilder.DropIndex(
                name: "IX_Antistics_SourceStatisticId",
                table: "Antistics");

            migrationBuilder.DropColumn(
                name: "SourceStatisticId",
                table: "Antistics");
        }
    }
}
