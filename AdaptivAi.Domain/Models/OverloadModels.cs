namespace AdaptivAi.Domain.Models;

public class ProgressiveOverloadAdvice
{
    public string ExerciseName { get; set; } = string.Empty;
    public double CurrentWeightKg { get; set; }
    public double RecommendedWeightKg { get; set; }
    public string Action { get; set; } = "MAINTAIN"; // "INCREASE", "MAINTAIN", "DELOAD"
    public string Reason { get; set; } = string.Empty;
}

public class ProgramOverloadAnalysisResponse
{
    public bool IsDeloadRecommended { get; set; }
    public string FatigueSummary { get; set; } = string.Empty;
    public List<ProgressiveOverloadAdvice> Advices { get; set; } = new();
}