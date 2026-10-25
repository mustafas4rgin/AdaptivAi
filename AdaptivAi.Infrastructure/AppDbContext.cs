
using AdaptivAi.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AdaptivAi.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<CoachChatMessage> CoachChatMessages { get; set; }
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<DailyCheckIn> DailyCheckIns => Set<DailyCheckIn>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();
    public DbSet<WorkoutProgram> WorkoutPrograms => Set<WorkoutProgram>();
    public DbSet<WorkoutRoutine> WorkoutRoutines => Set<WorkoutRoutine>();
    public DbSet<RoutineExercise> RoutineExercises => Set<RoutineExercise>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<WorkoutRoutine>()
            .HasMany(r => r.Exercises)
            .WithOne(e => e.WorkoutRoutine)
            .HasForeignKey(e => e.WorkoutRoutineId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DailyCheckIn>()
    .HasOne(c => c.UserProfile)
    .WithMany() // Koleksiyon navigation'ı belirtmeden tek yönlü ilişki
    .HasForeignKey(c => c.UserProfileId)
    .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserProfile>()
            .HasMany(u => u.WorkoutLogs)
            .WithOne(w => w.UserProfile)
            .HasForeignKey(w => w.UserProfileId);
    }
}