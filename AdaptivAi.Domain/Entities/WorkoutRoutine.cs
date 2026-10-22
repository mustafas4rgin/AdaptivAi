namespace AdaptivAi.Domain.Entities;

public class WorkoutRoutine
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserProfileId { get; set; }
    public string DayName { get; set; } = string.Empty; // örn: "1. Gün - Push (İtiş)", "2. Gün - Pull (Çekiş)", "3. Gün - Bacak (Legs)"
    public int DayOrder { get; set; } = 1; // 1'den 7'ye kadar gün sırası
    public bool IsRestDay { get; set; } = false; // Dinlenme günü mü?
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public UserProfile? UserProfile { get; set; }
    public List<RoutineExercise> Exercises { get; set; } = new();
}