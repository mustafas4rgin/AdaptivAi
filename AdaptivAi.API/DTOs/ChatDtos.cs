namespace AdaptivAi.API.DTOs;
using System.Text.Json.Serialization;
public class CoachChatRequest
{
    [JsonPropertyName("userId")]
    public Guid? UserId { get; set; }
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("language")]
    public string? Language { get; set; } = "tr";
}

public class CoachChatResponse
{
    [JsonPropertyName("userId")]
    public Guid? UserId { get; set; }
    public string Reply { get; set; } = string.Empty;
    public string? DetectedInjuryOrLimitation { get; set; }
}