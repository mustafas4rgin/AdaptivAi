using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdaptivAi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncWeeklySplitColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Name",
                table: "WorkoutRoutines",
                newName: "DayName");

            migrationBuilder.AddColumn<int>(
                name: "DayOrder",
                table: "WorkoutRoutines",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsRestDay",
                table: "WorkoutRoutines",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DayOrder",
                table: "WorkoutRoutines");

            migrationBuilder.DropColumn(
                name: "IsRestDay",
                table: "WorkoutRoutines");

            migrationBuilder.RenameColumn(
                name: "DayName",
                table: "WorkoutRoutines",
                newName: "Name");
        }
    }
}
