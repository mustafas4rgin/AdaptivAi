namespace AdaptivAi.API.DTOs;
using System.Text.Json.Serialization;
public class CheckInRequest
{
    [JsonPropertyName("routineDayId")]
    public Guid? RoutineDayId { get; set; }

    [JsonPropertyName("sleepHours")]
    public double SleepHours { get; set; }

    [JsonPropertyName("energyLevel")]
    public int EnergyLevel { get; set; }

    [JsonPropertyName("muscleSoreness")]
    public int MuscleSoreness { get; set; }

    [JsonPropertyName("painNotes")]
    public string? PainNotes { get; set; }

    [JsonPropertyName("language")]
    public string? Language { get; set; } = "tr";
}