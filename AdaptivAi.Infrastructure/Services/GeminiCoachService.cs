using System.Text;
using System.Text.Json;
using AdaptivAi.Domain.Entities;
using AdaptivAi.Domain.Models;
using Microsoft.Extensions.Configuration;

namespace AdaptivAi.Infrastructure.Services;

public class GeminiCoachService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    // Birincil ve yedek modeller
    private readonly string[] _candidateModels = new[]
{
    "gemini-3.8-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
};

    public GeminiCoachService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"] 
                  ?? throw new ArgumentNullException("Gemini:ApiKey yapılandırmada bulunamadı!");
    }

    public string BuildDynamicPrompt(UserProfile user, DailyCheckIn checkIn, string scheduledRoutine)
    {
        return $@"
[SPORCU PROFİLİ]
- Sporcu: {user.FullName} | Seviye: {user.FitnessLevel} | Hedef: {user.PrimaryGoal}
- Kronik Kısıtlar / Sakatlık Geçmişi: {(string.IsNullOrWhiteSpace(user.ChronicInjuries) ? "Yok" : user.ChronicInjuries)}

[GÜNCEL DURUM (CHECK-IN)]
- Uyku Süresi: {checkIn.SleepHours} saat
- Enerji Düzeyi (1-10): {checkIn.EnergyLevel}
- Genel Kas Yorgunluğu / DOMS (1-10): {checkIn.MuscleSoreness}
- Anlık Şikayet / Ağrı: {(string.IsNullOrWhiteSpace(checkIn.PainNotes) ? "Yok" : checkIn.PainNotes)}

[PLANLANAN ANTRENMAN AKIŞI]
{scheduledRoutine}

GÖREV:
Yukarıdaki verilere göre antrenmanı uyarla. Sakatlık veya ağrı bölgesini zorlayan serbest ağırlık hareketlerini güvenli alternatiflerle değiştir. Yorgunluk/uykusuzluk yüksekse set ve RPE hacmini güvenli eşiğe çek.";
    }

    public async Task<WorkoutAdaptationResponse?> AdaptWorkoutAsync(string prompt)
    {
        var systemPrompt = @"
Sen AdaptivAI Baş Hipertrofi ve Performans Koçusun.
Görevin: Kullanıcının biyometrik durumuna ve ağrılarına göre antrenmanı optimize etmek.

Kurallar:
1. Yanıtı SADECE ve SADECE saf JSON formatında dön. Markdown backtick (```json) ASLA ekleme.
2. Aşağıdaki JSON şemasına ve anahtar isimlerine BİREBİR uy:
{
  ""readiness_score"": 65,
  ""coach_comment"": ""Ağrı ve uykusuzluk durumuna göre yapılan koçluk özeti."",
  ""modified_exercises"": [
    {
      ""original_name"": ""Incline Dumbbell Bench Press"",
      ""action"": ""REPLACED"",
      ""exercise_name"": ""Machine Chest Press"",
      ""sets"": 3,
      ""reps"": ""10-12"",
      ""rpe"": 7.0,
      ""reason"": ""Omuz batması nedeniyle serbest ağırlık stabilizasyon yükü kaldırıldı.""
    }
  ],
  ""nutrition_tip"": ""Antrenman öncesi ve toparlanma için mikro beslenme önerisi.""
}";

        var payload = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            },
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = new
            {
                response_mime_type = "application/json",
                temperature = 0.2
            }
        };

        var rawJsonText = await PostWithRetryAsync(payload);

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        return JsonSerializer.Deserialize<WorkoutAdaptationResponse>(rawJsonText, options);
    }

    public async Task<string> AskCoachAsync(UserProfile user, WorkoutLog? latestLog, string userMessage)
    {
        var contextInfo = latestLog is null 
            ? "Henüz bugün için kaydedilmiş bir antrenman adaptasyonu yok." 
            : $"Bugünkü Antrenman Planı: {latestLog.AdaptedPlanJson}\nGünün Readiness Skoru: {latestLog.ReadinessScore}";

        var systemPrompt = $@"
Sen AdaptivAI Baş Hipertrofi, Biyomekanik ve Performans Koçusun.
Kullanıcının spor hekimliği ve antrenman bilimi uzmanı olarak hareket ediyorsun.

[KULLANICI BİLGİLERİ]
- İsim: {user.FullName}
- Seviye: {user.FitnessLevel}
- Hedef: {user.PrimaryGoal}
- Kronik Rahatsızlıklar/Kısıtlar: {(string.IsNullOrWhiteSpace(user.ChronicInjuries) ? "Yok" : user.ChronicInjuries)}

[GÜNCEL ANTRENMAN CONTEXT'İ]
{contextInfo}

TALİMATLAR:
1. Kullanıcının sorusunu doğrudan, net, bilimsel ama motive edici bir spor koçu diliyle yanıtla.
2. Eğer hareket alternatifi, ağrı veya ekipman eksikliği soruyorsa, kullanıcının sakatlık geçmişini ve bugünkü programını kesinlikle göz önünde bulundur.
3. Gereksiz dolambaçlı laflar etme; pratik, uygulanabilir çözümler ver.";

        var payload = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            },
            contents = new[]
            {
                new { parts = new[] { new { text = userMessage } } }
            },
            generationConfig = new
            {
                temperature = 0.4
            }
        };

        return await PostWithRetryAsync(payload);
    }

    /// <summary>
    /// 503 veya geçici hatalarda sırasıyla modelleri ve retry mekanizmasını dener.
    /// </summary>
    private async Task<string> PostWithRetryAsync(object payload)
    {
        string? lastError = null;

        foreach (var model in _candidateModels)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={_apiKey}";
            
            // Model başına 2 deneme hakkı
            for (int attempt = 1; attempt <= 2; attempt++)
            {
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(url, content);

                if (response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseBody);
                    var text = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();

                    return text ?? string.Empty;
                }

                lastError = await response.Content.ReadAsStringAsync();

                // Eğer 503 (High Demand) ya da 429 (Rate Limit) ise 1 saniye bekle tekrar dene
                if ((int)response.StatusCode == 503 || (int)response.StatusCode == 429)
                {
                    await Task.Delay(1000);
                    continue;
                }

                // 404 (model bulunamadı) veya başka bir şeyse vakit kaybetmeden listedeki bir sonraki modele geç
                break;
            }
        }

        throw new Exception($"Gemini API tüm denemelerde başarısız oldu. Son hata: {lastError}");
    }
}