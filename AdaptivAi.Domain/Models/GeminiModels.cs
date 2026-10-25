namespace AdaptivAi.Domain.Models;

public class CoachChatResult
{
    public string Reply { get; set; } = string.Empty;
    public string? DetectedInjuryOrLimitation { get; set; } // Chat içinde yeni bahsedilen bir sakatlık varsa doldurur
}