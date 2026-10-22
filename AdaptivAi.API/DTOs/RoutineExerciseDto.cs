namespace AdaptivAi.API.DTOs;
public class RoutineExerciseDto
{
    public Guid Id { get; set; }
    public string ExerciseName { get; set; } = string.Empty;
    public int Sets { get; set; }
    public string TargetReps { get; set; } = string.Empty;
    public double TargetRpe { get; set; }
    public int OrderIndex { get; set; }
}