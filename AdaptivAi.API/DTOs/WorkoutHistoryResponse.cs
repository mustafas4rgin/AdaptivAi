namespace AdaptivAi.API.DTOs;

public class WorkoutHistoryResponse
{
    public Guid Id { get; set; }
    public string RoutineName { get; set; } = string.Empty;
    public int ReadinessScore { get; set; }
    public DateTime WorkoutDate { get; set; }
    public object? AdaptedPlan { get; set; }
}