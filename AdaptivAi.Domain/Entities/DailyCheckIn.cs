namespace AdaptivAi.Domain.Entities;

public class DailyCheckIn
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserProfileId { get; set; }
    public DateTime CheckInDate { get; set; } = DateTime.UtcNow;
    public double SleepHours { get; set; }
    public int EnergyLevel { get; set; } // 1-10 arası
    public int MuscleSoreness { get; set; } // 1-10 arası (DOMS)
    public string PainNotes { get; set; } = string.Empty; // "Sol omuz ön kısım batıyor"
    
    public UserProfile UserProfile { get; set; } = null!;
}