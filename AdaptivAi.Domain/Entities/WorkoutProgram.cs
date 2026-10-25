namespace AdaptivAi.Domain.Entities;

public class WorkoutProgram
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserProfileId { get; set; }
    public string Name { get; set; } = string.Empty; // Örn: "4 Günlük PPL Hipertrofi", "Full Body Güç"
    public string? Description { get; set; }
    public bool IsActive { get; set; } = false; // Aktif olarak takip edilen program mı?
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public UserProfile? UserProfile { get; set; }
    public List<WorkoutRoutine> Routines { get; set; } = new();
}