namespace AdaptivAi.Domain.Entities;

public class UserProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public int Age { get; set; }
    public double WeightKg { get; set; }
    public double HeightCm { get; set; }
    public string FitnessLevel { get; set; } = "Intermediate"; // Beginner, Intermediate, Advanced
    public string PrimaryGoal { get; set; } = "Hypertrophy"; // Hypertrophy, Strength, FatLoss
    public string ChronicInjuries { get; set; } = string.Empty; // Örn: "Sol omuz impingement geçmişi"
    
    public ICollection<DailyCheckIn> CheckIns { get; set; } = new List<DailyCheckIn>();
    public ICollection<WorkoutLog> WorkoutLogs { get; set; } = new List<WorkoutLog>();
}