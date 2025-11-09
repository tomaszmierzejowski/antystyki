using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Antystics.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSocialAuthFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Provider",
                table: "AspNetUsers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderUserId",
                table: "AspNetUsers",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_Provider_ProviderUserId",
                table: "AspNetUsers",
                columns: new[] { "Provider", "ProviderUserId" },
                unique: true,
                filter: "\"Provider\" IS NOT NULL AND \"ProviderUserId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_Provider_ProviderUserId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Provider",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ProviderUserId",
                table: "AspNetUsers");
        }
    }
}
