namespace AdaptivAi.Domain.Entities;

public class WorkoutLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserProfileId { get; set; }
    public DateTime WorkoutDate { get; set; } = DateTime.UtcNow;
    public string RoutineName { get; set; } = string.Empty; // Örn: "Push Day A"
    public string OriginalPlanJson { get; set; } = string.Empty;
    public string AdaptedPlanJson { get; set; } = string.Empty;
    public int ReadinessScore { get; set; }
    public bool IsCompleted { get; set; } = false;

    public UserProfile UserProfile { get; set; } = null!;
}