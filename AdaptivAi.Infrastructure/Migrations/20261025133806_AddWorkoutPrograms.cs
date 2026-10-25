using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdaptivAi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutPrograms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "WorkoutProgramId",
                table: "WorkoutRoutines",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WorkoutProgram",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutProgram", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkoutProgram_UserProfiles_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "UserProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutRoutines_WorkoutProgramId",
                table: "WorkoutRoutines",
                column: "WorkoutProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutProgram_UserProfileId",
                table: "WorkoutProgram",
                column: "UserProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutRoutines_WorkoutProgram_WorkoutProgramId",
                table: "WorkoutRoutines",
                column: "WorkoutProgramId",
                principalTable: "WorkoutProgram",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutRoutines_WorkoutProgram_WorkoutProgramId",
                table: "WorkoutRoutines");

            migrationBuilder.DropTable(
                name: "WorkoutProgram");

            migrationBuilder.DropIndex(
                name: "IX_WorkoutRoutines_WorkoutProgramId",
                table: "WorkoutRoutines");

            migrationBuilder.DropColumn(
                name: "WorkoutProgramId",
                table: "WorkoutRoutines");
        }
    }
}
