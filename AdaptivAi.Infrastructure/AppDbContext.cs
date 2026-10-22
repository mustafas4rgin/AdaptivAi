
using AdaptivAi.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AdaptivAi.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<DailyCheckIn> DailyCheckIns => Set<DailyCheckIn>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();

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

        modelBuilder.Entity<UserProfile>()
            .HasMany(u => u.CheckIns)
            .WithOne(c => c.UserProfile)
            .HasForeignKey(c => c.UserProfileId);

        modelBuilder.Entity<UserProfile>()
            .HasMany(u => u.WorkoutLogs)
            .WithOne(w => w.UserProfile)
            .HasForeignKey(w => w.UserProfileId);
    }
}