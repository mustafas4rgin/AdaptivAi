namespace AdaptivAi.Domain.Entities;

public class UserProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int Age { get; set; }
    public decimal HeightCm { get; set; }
    public decimal WeightKg { get; set; }
    public string FitnessLevel { get; set; } = "Orta";
    public string PrimaryGoal { get; set; } = "Hipertrofi";
    public string? ChronicInjuries { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public ICollection<DailyCheckIn> CheckIns { get; set; } = new List<DailyCheckIn>();
    public ICollection<WorkoutRoutine> WorkoutRoutines { get; set; } = new List<WorkoutRoutine>();
    public ICollection<WorkoutLog> WorkoutLogs { get; set; } = new List<WorkoutLog>();
}