using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdaptivAi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTargetWeightColumnActual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "TargetWeightKg",
                table: "RoutineExercises",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetWeightKg",
                table: "RoutineExercises");
        }
    }
}
