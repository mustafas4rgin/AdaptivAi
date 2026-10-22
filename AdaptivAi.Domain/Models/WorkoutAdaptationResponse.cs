using System.Text.Json.Serialization;

namespace AdaptivAi.Domain.Models;

public class WorkoutAdaptationResponse
{
    [JsonPropertyName("readiness_score")]
    public int ReadinessScore { get; set; }

    [JsonPropertyName("coach_comment")]
    public string CoachComment { get; set; } = string.Empty;

    [JsonPropertyName("modified_exercises")]
    public List<ModifiedExercise> ModifiedExercises { get; set; } = new();

    [JsonPropertyName("nutrition_tip")]
    public string NutritionTip { get; set; } = string.Empty;
}

public class ModifiedExercise
{
    [JsonPropertyName("original_name")]
    public string OriginalName { get; set; } = string.Empty;

    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty; // KEPT, REPLACED, DROPPED

    [JsonPropertyName("exercise_name")]
    public string ExerciseName { get; set; } = string.Empty;

    [JsonPropertyName("sets")]
    public int Sets { get; set; }

    [JsonPropertyName("reps")]
    public string Reps { get; set; } = string.Empty;

    [JsonPropertyName("rpe")]
    public double Rpe { get; set; }

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;
}