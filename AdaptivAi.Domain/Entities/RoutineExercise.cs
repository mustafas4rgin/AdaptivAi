namespace AdaptivAi.Domain.Entities;

public class RoutineExercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkoutRoutineId { get; set; }
    public string ExerciseName { get; set; } = string.Empty;
    public int Sets { get; set; } = 3;
    public string TargetReps { get; set; } = "8-10";
    public double TargetRpe { get; set; } = 8.0;
    public int OrderIndex { get; set; } = 0;
    public double? TargetWeightKg { get; set; }

    // Navigation Property
    public WorkoutRoutine? WorkoutRoutine { get; set; }
}