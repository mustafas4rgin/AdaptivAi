namespace AdaptivAi.Domain.Entities;

public class CoachChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserProfileId { get; set; }
    public string Sender { get; set; } = "user"; // "user" veya "coach"
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public UserProfile UserProfile { get; set; } = null!;
}