using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class PasswordlessAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Players");

            migrationBuilder.AddColumn<string>(
                name: "LoginCode",
                table: "Players",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LoginCodeExpiry",
                table: "Players",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LoginCode",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "LoginCodeExpiry",
                table: "Players");

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Players",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
