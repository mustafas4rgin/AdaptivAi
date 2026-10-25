using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdaptivAi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncWorkoutPrograms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutProgram_UserProfiles_UserProfileId",
                table: "WorkoutProgram");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutRoutines_WorkoutProgram_WorkoutProgramId",
                table: "WorkoutRoutines");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkoutProgram",
                table: "WorkoutProgram");

            migrationBuilder.RenameTable(
                name: "WorkoutProgram",
                newName: "WorkoutPrograms");

            migrationBuilder.RenameIndex(
                name: "IX_WorkoutProgram_UserProfileId",
                table: "WorkoutPrograms",
                newName: "IX_WorkoutPrograms_UserProfileId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkoutPrograms",
                table: "WorkoutPrograms",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutPrograms_UserProfiles_UserProfileId",
                table: "WorkoutPrograms",
                column: "UserProfileId",
                principalTable: "UserProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutRoutines_WorkoutPrograms_WorkoutProgramId",
                table: "WorkoutRoutines",
                column: "WorkoutProgramId",
                principalTable: "WorkoutPrograms",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutPrograms_UserProfiles_UserProfileId",
                table: "WorkoutPrograms");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutRoutines_WorkoutPrograms_WorkoutProgramId",
                table: "WorkoutRoutines");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkoutPrograms",
                table: "WorkoutPrograms");

            migrationBuilder.RenameTable(
                name: "WorkoutPrograms",
                newName: "WorkoutProgram");

            migrationBuilder.RenameIndex(
                name: "IX_WorkoutPrograms_UserProfileId",
                table: "WorkoutProgram",
                newName: "IX_WorkoutProgram_UserProfileId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkoutProgram",
                table: "WorkoutProgram",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutProgram_UserProfiles_UserProfileId",
                table: "WorkoutProgram",
                column: "UserProfileId",
                principalTable: "UserProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutRoutines_WorkoutProgram_WorkoutProgramId",
                table: "WorkoutRoutines",
                column: "WorkoutProgramId",
                principalTable: "WorkoutProgram",
                principalColumn: "Id");
        }
    }
}
