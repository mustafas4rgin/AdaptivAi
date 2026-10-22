namespace AdaptivAi.API.DTOs;
public class SaveRoutineDayRequest
{
    public string DayName { get; set; } = string.Empty;
    public int DayOrder { get; set; }
    public bool IsRestDay { get; set; }
    public List<CreateOrUpdateExerciseRequest> Exercises { get; set; } = new();
}