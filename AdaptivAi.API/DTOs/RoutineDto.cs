namespace AdaptivAi.API.DTOs;
public class RoutineDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public List<RoutineExerciseDto> Exercises { get; set; } = new();
}