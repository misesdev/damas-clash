using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddNostrPubKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NostrPubKey",
                table: "Players",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Players_NostrPubKey",
                table: "Players",
                column: "NostrPubKey",
                unique: true,
                filter: "\"NostrPubKey\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Players_NostrPubKey",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "NostrPubKey",
                table: "Players");
        }
    }
}
