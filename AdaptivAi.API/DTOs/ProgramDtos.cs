namespace AdaptivAi.Domain.Models;

public class WorkoutProgramDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int DaysCount { get; set; }
}

public class CreateProgramRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool SetAsActive { get; set; } = true;
    public SaveWeeklyPlanRequest Plan { get; set; } = new();
}