namespace AdaptivAi.API.DTOs;
public class SaveWeeklyPlanRequest
{
    public List<SaveRoutineDayRequest> Days { get; set; } = new();
}