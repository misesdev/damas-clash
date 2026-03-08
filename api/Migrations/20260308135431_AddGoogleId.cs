using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GoogleId",
                table: "Players",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Players_GoogleId",
                table: "Players",
                column: "GoogleId",
                unique: true,
                filter: "\"GoogleId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Players_GoogleId",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "GoogleId",
                table: "Players");
        }
    }
}
