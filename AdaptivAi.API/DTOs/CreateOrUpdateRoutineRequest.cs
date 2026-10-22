namespace AdaptivAi.API.DTOs;
public class CreateOrUpdateRoutineRequest
{
    public string Name { get; set; } = string.Empty;
    public List<CreateOrUpdateExerciseRequest> Exercises { get; set; } = new();
}