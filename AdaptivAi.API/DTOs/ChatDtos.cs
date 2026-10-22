namespace AdaptivAi.API.DTOs;

public class CoachChatRequest
{
    public Guid UserId { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class CoachChatResponse
{
    public string Reply { get; set; } = string.Empty;
}