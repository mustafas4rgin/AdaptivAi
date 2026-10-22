namespace AdaptivAi.API.DTOs;

public class CheckInRequest
{
    public Guid? RoutineDayId { get; set; } // Kullanıcının o gün seçtiği antrenman günü
    public double SleepHours { get; set; }
    public int EnergyLevel { get; set; }
    public int MuscleSoreness { get; set; }
    public string? PainNotes { get; set; }
}