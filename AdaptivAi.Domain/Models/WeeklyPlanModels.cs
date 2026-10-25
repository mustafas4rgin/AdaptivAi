using System.Text.Json.Serialization;

namespace AdaptivAi.Domain.Models;

public class SaveWeeklyPlanRequest
{
    [JsonPropertyName("days")]
    public List<SaveRoutineDayRequest> Days { get; set; } = new();
}

public class SaveRoutineDayRequest
{
    [JsonPropertyName("dayName")]
    public string DayName { get; set; } = string.Empty;

    [JsonPropertyName("dayOrder")]
    public int DayOrder { get; set; }

    [JsonPropertyName("isRestDay")]
    public bool IsRestDay { get; set; }

    [JsonPropertyName("exercises")]
    public List<SaveRoutineExerciseRequest> Exercises { get; set; } = new();
}

public class SaveRoutineExerciseRequest
{
    [JsonPropertyName("exerciseName")]
    public string ExerciseName { get; set; } = string.Empty;

    [JsonPropertyName("sets")]
    public int Sets { get; set; } = 3;

    [JsonPropertyName("targetReps")]
    public string TargetReps { get; set; } = "8-10";

    [JsonPropertyName("targetRpe")]
    public double TargetRpe { get; set; } = 8.0;

    [JsonPropertyName("targetWeightKg")]
    public double? TargetWeightKg { get; set; }
}