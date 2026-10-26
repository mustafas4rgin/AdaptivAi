using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using AdaptivAi.Domain.Entities;
using AdaptivAi.Domain.Models;
using Microsoft.Extensions.Configuration;

namespace AdaptivAi.Infrastructure.Services;

public class GeminiCoachService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    private readonly string[] _candidateModels = new[]
    {
        "gemini-3.8-flash"
    };

    // Constructor kontrolü:
public GeminiCoachService(HttpClient httpClient, IConfiguration configuration)
{
    _httpClient = httpClient;
    // Eğer Render'da key GEMINI_API_KEY ise:
    _apiKey = configuration["Gemini:ApiKey"] 
           ?? configuration["Gemini__ApiKey"] 
           ?? configuration["GEMINI_API_KEY"] 
           ?? string.Empty;

    Console.WriteLine($"[DEBUG] Key uzunluğu: {_apiKey.Length}, İlk 4 hane: {(_apiKey.Length > 4 ? _apiKey[..4] : "YOK")}");
}

    // 0. Prompt Oluşturucu Yardımcı Metotlar (Debug & Logger Köprüsü)
    public string BuildDynamicPrompt(UserProfile user, DailyCheckIn checkIn, string? routineContext = null, string lang = "tr")
    {
        var langRule = lang.ToLowerInvariant() == "en"
            ? "Respond in fluent English using sports science terminology."
            : "Tüm açıklamaları Türkçe ve spor bilimi terimleriyle yaz.";

        return $@"
User: {user.FullName} | Level: {user.FitnessLevel} | Goal: {user.PrimaryGoal}
Injuries: {(string.IsNullOrWhiteSpace(user.ChronicInjuries) ? "None" : user.ChronicInjuries)}
Sleep: {checkIn.SleepHours}h | Energy: {checkIn.EnergyLevel}/10 | Soreness: {checkIn.MuscleSoreness}/10
Routine: {routineContext ?? "Standart Push/Pull/Legs"}
Language Directive: {langRule}";
    }

    public string BuildDynamicPrompt(UserProfile user, WorkoutRoutine routine, DailyCheckIn checkIn, string lang = "tr")
    {
        return BuildDynamicPrompt(user, checkIn, routine?.DayName, lang);
    }

    // 1. Günlük Adaptasyon Üretimi - Overload Metot (Endpoint'ten doğrudan çağrılabilmesi için)
    public async Task<WorkoutAdaptationResponse> AdaptWorkoutAsync(
        UserProfile user,
        DailyCheckIn checkIn,
        WorkoutRoutine? currentRoutine = null,
        string lang = "tr")
    {
        var routineToUse = currentRoutine ?? new WorkoutRoutine
        {
            DayName = "Günlük Seans",
            Exercises = new List<RoutineExercise>()
        };

        return await AdaptWorkoutAsync(user, routineToUse, checkIn, lang);
    }

    // 1. Günlük Adaptasyon Üretimi - Ana Metot
    public async Task<WorkoutAdaptationResponse> AdaptWorkoutAsync(
        UserProfile user,
        WorkoutRoutine currentRoutine,
        DailyCheckIn checkIn,
        string lang = "tr")
    {
var safeExercises = currentRoutine?.Exercises ?? Enumerable.Empty<RoutineExercise>();
        var exercisesList = safeExercises
            .OrderBy(e => e.OrderIndex)
            .Select(e => new
            {
                e.ExerciseName,
                e.Sets,
                e.TargetReps,
                e.TargetRpe,
                TargetWeightKg = e.TargetWeightKg ?? 0.0
            })
            .ToList();

        var exercisesJson = JsonSerializer.Serialize(exercisesList);

        var langRule = lang.ToLowerInvariant() == "en"
            ? "IMPORTANT: Output ALL texts (coach_comment, nutrition_tip, reason) strictly in fluent ENGLISH using sports science terminology."
            : "ÖNEMLİ: Tüm metinleri (coach_comment, nutrition_tip, reason) tamamen akıcı ve motive edici TÜRKÇE olarak yaz.";

        var routineName = currentRoutine?.DayName ?? "Genel Seans";

        var systemPrompt = $@"
You are AdaptivAI Head Biomechanics, Hypertrophy, and Recovery Coach.
Your mission is to adapt today's workout based on readiness metrics and progressive overload principles.

{langRule}

[USER PROFILE]
- Name: {user.FullName}
- Fitness Level: {user.FitnessLevel}
- Primary Goal: {user.PrimaryGoal}
- Chronic Limitations / Injuries: {(string.IsNullOrWhiteSpace(user.ChronicInjuries) ? "None" : user.ChronicInjuries)}

[TODAY'S BIOMETRIC CHECK-IN]
- Sleep: {checkIn.SleepHours} hours
- Energy: {checkIn.EnergyLevel} / 10
- Muscle Soreness: {checkIn.MuscleSoreness} / 10
- Acute Pain Notes: {(string.IsNullOrWhiteSpace(checkIn.PainNotes) ? "None" : checkIn.PainNotes)}

[SCHEDULED ROUTINE]
Routine Name: {routineName}
Original Exercises:
{exercisesJson}

RULES:
1. Calculate a readiness_score between 0 and 100.
2. If readiness >= 80, apply progressive overload (increase weight by 1-2.5 kg or maintain with higher RPE).
3. If soreness >= 7 or sleep < 6 or acute pain is present, reduce intensity or substitute exercises to protect joints/implants.
4. Output MUST be valid, raw JSON conforming exactly to the schema. Do not wrap in Markdown fences.";

        var userPrompt = @"
Return JSON with the following structure:
{
  ""readiness_score"": 85,
  ""coach_comment"": ""String"",
  ""nutrition_tip"": ""String"",
  ""modified_exercises"": [
    {
      ""exercise_name"": ""String"",
      ""original_name"": ""String"",
      ""action"": ""KEPT"" or ""REPLACED"",
      ""sets"": 3,
      ""reps"": ""8-10"",
      ""rpe"": 8.5,
      ""previous_weight_kg"": 25.0,
      ""suggested_weight_kg"": 26.0,
      ""reason"": ""String""
    }
  ]
}";

        var payload = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            },
            contents = new[]
            {
                new { parts = new[] { new { text = userPrompt } } }
            },
            generationConfig = new
            {
                response_mime_type = "application/json",
                temperature = 0.2
            }
        };

        var rawJson = await PostWithRetryAsync(payload);
        var cleaned = CleanMarkdownJson(rawJson);

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString
        };

        var result = JsonSerializer.Deserialize<WorkoutAdaptationResponse>(cleaned, options);
        return result ?? throw new Exception("Adaptasyon JSON nesnesine dönüştürülemedi.");
    }

    // 2. Sıfırdan Optimal Haftalık Program Oluşturma (Routine Builder)
    public async Task<SaveWeeklyPlanRequest?> GenerateOptimalRoutineAsync(
        UserProfile user,
        int daysPerWeek,
        string focusArea,
        string equipmentType,
        string extraNotes,
        string lang = "tr")
    {
        var langRule = lang.ToLowerInvariant() == "en"
            ? "IMPORTANT: Output all routine day names and exercise notes in ENGLISH."
            : "ÖNEMLİ: Tüm gün isimlerini ve egzersiz adlandırmalarını anlaşılır TÜRKÇE terimlerle yaz.";

        var systemPrompt = $@"
You are AdaptivAI Head Hypertrophy and Exercise Science Architect.
Design a complete, scientifically periodized weekly split.

{langRule}

[USER PROFILE]
- Name: {user.FullName}
- Fitness Level: {user.FitnessLevel}
- Goal: {user.PrimaryGoal}
- Chronic Injuries / Implants: {(string.IsNullOrWhiteSpace(user.ChronicInjuries) ? "None" : user.ChronicInjuries)}

[CRITERIA]
- Days Per Week: {daysPerWeek}
- Focus Area: {focusArea}
- Equipment: {equipmentType}
- Specific Notes: {(string.IsNullOrWhiteSpace(extraNotes) ? "None" : extraNotes)}

CRITICAL:
- 'targetWeightKg' must be a numeric value only (e.g. 20.0 or 0.0, never append 'kg').
- Output must strictly be raw JSON matching the SaveWeeklyPlanRequest schema.";

        var userRequest = $@"
Generate the weekly routine in this exact JSON schema:
{{
  ""days"": [
    {{
      ""dayName"": ""Push"",
      ""dayOrder"": 1,
      ""isRestDay"": false,
      ""exercises"": [
        {{
          ""exerciseName"": ""Incline Dumbbell Press"",
          ""sets"": 3,
          ""targetReps"": ""8-10"",
          ""targetRpe"": 8.5,
          ""targetWeightKg"": 26.0
        }}
      ]
    }}
  ]
}}";

        var payload = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            },
            contents = new[]
            {
                new { parts = new[] { new { text = userRequest } } }
            },
            generationConfig = new
            {
                response_mime_type = "application/json",
                temperature = 0.2
            }
        };

        try
        {
            var rawJsonText = await PostWithRetryAsync(payload);
            var cleanedJson = CleanMarkdownJson(rawJsonText);

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString
            };

            return JsonSerializer.Deserialize<SaveWeeklyPlanRequest>(cleanedJson, options);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GENERATE ROUTINE ERROR] Hata: {ex.Message}");
            return null;
        }
    }

    // 3. Koç Sohbeti & Sakatlık Çıkarım Motoru (Coach Chat)
    public async Task<CoachChatResult> AskCoachAsync(
        UserProfile user,
        WorkoutLog? latestLog,
        string userMessage,
        string lang = "tr")
    {
        var contextInfo = latestLog is null
            ? "Henüz bugün için bir antrenman adaptasyon kaydı yok."
            : $"Antrenman: {latestLog.RoutineName}\nReadiness Skoru: {latestLog.ReadinessScore}\nPlan Özeti: {latestLog.AdaptedPlanJson}";

        var langRule = lang.ToLowerInvariant() == "en"
            ? "IMPORTANT: Provide your response strictly in fluent ENGLISH."
            : "ÖNEMLİ: Cevabını tamamen Türkçe, samimi ve uzman bir koç diliyle ver.";

        var systemPrompt = $@"
You are AdaptivAI Head Biomechanics and Performance Coach.
{langRule}

[USER PROFILE]
- Name: {user.FullName}
- Fitness Level: {user.FitnessLevel}
- Goal: {user.PrimaryGoal}
- Known Chronic Injuries / Implants: {(string.IsNullOrWhiteSpace(user.ChronicInjuries) ? "None" : user.ChronicInjuries)}

[CURRENT CONTEXT]
{contextInfo}

INSTRUCTIONS:
1. Answer the user's question directly with sound biomechanical and hypertrophy knowledge.
2. MEDICAL EXTRACTION: If the user mentions any past or acute injury, surgical history, fracture, implant, or persistent joint pain in their message (e.g. 'my leg was fractured', 'shoulder pinch', 'orthopedic plate'), summarize it in the 'detected_injury' field. If no new injury is mentioned, set it to null.
3. Output MUST strictly be valid JSON:
{{
  ""reply"": ""Coach reply text..."",
  ""detected_injury"": ""Summary of detected condition or null""
}}";

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
                response_mime_type = "application/json",
                temperature = 0.3
            }
        };

        try
        {
            var rawJson = await PostWithRetryAsync(payload);
            var cleaned = CleanMarkdownJson(rawJson);
            using var doc = JsonDocument.Parse(cleaned);

            var reply = doc.RootElement.GetProperty("reply").GetString() ?? string.Empty;
            string? injury = null;
            if (doc.RootElement.TryGetProperty("detected_injury", out var injuryElem) && injuryElem.ValueKind == JsonValueKind.String)
            {
                injury = injuryElem.GetString();
            }

            return new CoachChatResult
            {
                Reply = reply,
                DetectedInjuryOrLimitation = injury
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CHAT PARSE ERROR]: {ex.Message}");
            return new CoachChatResult 
            { 
                Reply = lang == "en" 
                    ? "Understood. I will adjust your biomechanical flow accordingly." 
                    : "Anladım. Biyomekanik akışını buna göre optimize edeceğim." 
            };
        }
    }

    // 4. Overload / Deload Analiz Motoru
    public async Task<OverloadAdviceResponse> AnalyzeOverloadAsync(
        UserProfile user,
        List<WorkoutLog> recentLogs,
        string lang = "tr")
    {
        var logsSummary = recentLogs
            .OrderByDescending(l => l.WorkoutDate)
            .Take(7)
            .Select(l => new { l.WorkoutDate, l.ReadinessScore, l.RoutineName })
            .ToList();

        var langRule = lang.ToLowerInvariant() == "en"
            ? "Provide fatigueSummary and progressiveTips strictly in ENGLISH."
            : "fatigueSummary ve progressiveTips alanlarını Türkçe yaz.";

        var systemPrompt = $@"
You are AdaptivAI Central Nervous System (CNS) Fatigue and Progression Analyst.
{langRule}

User: {user.FullName} | Seviye: {user.FitnessLevel}
Son Seanslar: {JsonSerializer.Serialize(logsSummary)}

Kurallar:
- Ortalama readiness < 65 ise veya art arda 3 gün düşük skor varsa isDeloadRecommended = true ver.
- Çıktı kesinlikle şu JSON formatında olmalı:
{{
  ""isDeloadRecommended"": false,
  ""fatigueSummary"": ""String"",
  ""progressiveTips"": [""String""]
}}";

        var payload = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = systemPrompt } } }
            },
            generationConfig = new
            {
                response_mime_type = "application/json",
                temperature = 0.2
            }
        };

        try
        {
            var raw = await PostWithRetryAsync(payload);
            var cleaned = CleanMarkdownJson(raw);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<OverloadAdviceResponse>(cleaned, options)
                ?? new OverloadAdviceResponse { FatigueSummary = "Normal toparlanma süreci." };
        }
        catch
        {
            return new OverloadAdviceResponse 
            { 
                IsDeloadRecommended = false, 
                FatigueSummary = "Toparlanma dengeli seyrediyor." 
            };
        }
    }

    // 5. HTTP İletişim & URL Güvenliği Metodu
    private async Task<string> PostWithRetryAsync(object payload)
{
    string? lastError = null;

    foreach (var model in _candidateModels)
    {
        var cleanModel = model.Trim();
        var urlString = $"https://generativelanguage.googleapis.com/v1beta/models/{cleanModel}:generateContent";

        if (!Uri.TryCreate(urlString, UriKind.Absolute, out var requestUri))
        {
            Console.WriteLine($"[GEMINI ERROR] Geçersiz URI: {urlString}");
            continue;
        }

        for (int attempt = 1; attempt <= 2; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, requestUri);

            // ÖNEMLİ: Çakışabilecek default header'ları temizle ve resmi Google API anahtar başlığını ekle
            request.Headers.Remove("Authorization");
            request.Headers.TryAddWithoutValidation("x-goog-api-key", _apiKey.Trim());

            var jsonBody = JsonSerializer.Serialize(payload);
            request.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);

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
            Console.WriteLine($"[GEMINI ERROR] Model: {model} | Status: {(int)response.StatusCode} | Detay: {lastError}");

            if ((int)response.StatusCode == 503 || (int)response.StatusCode == 429)
            {
                await Task.Delay(1000);
                continue;
            }

            break;
        }
    }

    throw new Exception($"Gemini API tüm modellerde başarısız oldu. Son hata: {lastError}");
}

    private static string CleanMarkdownJson(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "{}";
        var cleaned = Regex.Replace(raw, @"^```json\s*", string.Empty, RegexOptions.Multiline);
        cleaned = Regex.Replace(cleaned, @"^```\s*", string.Empty, RegexOptions.Multiline);
        return cleaned.Trim();
    }
}