namespace AdaptivAi.API.DTOs;
public class RoutineDayDto
{
    public Guid Id { get; set; }
    public string DayName { get; set; } = string.Empty;
    public int DayOrder { get; set; }
    public bool IsRestDay { get; set; }
    public List<RoutineExerciseDto> Exercises { get; set; } = new();
}