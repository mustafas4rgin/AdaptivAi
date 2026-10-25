using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using AdaptivAi.API.DTOs;
using AdaptivAi.Domain.Entities;
using AdaptivAi.Domain.Models;
using AdaptivAi.Infrastructure.Data;
using AdaptivAi.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AdaptivAi.API.Endpoints;

public static class CoachEndpoints
{
    public static RouteGroupBuilder MapCoachEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/coach").WithTags("Coach");

        // Program Havuzu & Yönetimi
        group.MapGet("/chat/history/{userId:guid}", GetChatHistory).WithName("GetChatHistory");
        group.MapGet("/programs/{userId:guid}", GetUserPrograms).WithName("GetUserPrograms");
        group.MapPost("/programs/{userId:guid}", CreateProgram).WithName("CreateProgram");
        group.MapPost("/programs/{userId:guid}/activate/{programId:guid}", SetActiveProgram).WithName("SetActiveProgram");
        group.MapDelete("/programs/{userId:guid}/{programId:guid}", DeleteProgram).WithName("DeleteProgram");

        // Rutinler
        group.MapGet("/routines/{userId:guid}", GetUserRoutines).WithName("GetUserRoutines");
        group.MapPost("/routines/{userId:guid}", SaveUserRoutine).WithName("SaveUserRoutine");
        group.MapPost("/log-workout-weights/{userId:guid}", LogWorkoutWeights).WithName("LogWorkoutWeights");
        // Günlük İşlemler & AI
        group.MapPost("/check-in-and-adapt", AdaptWorkout).WithName("CheckInAndAdapt");
        group.MapPost("/chat", ChatWithCoach).WithName("CoachChat");
        group.MapGet("/history/{userId:guid?}", GetHistory).WithName("GetWorkoutHistory");
        group.MapGet("/today/{userId:guid}", GetTodayStatus).WithName("GetTodayStatus");
        group.MapPost("/generate-optimal-routine", GenerateOptimalRoutine).WithName("GenerateOptimalRoutine");

        // Progressive Overload & Deload Analiz Motoru
        group.MapGet("/overload-advice/{userId:guid}", GetOverloadAdvice).WithName("GetOverloadAdvice");

        return group;
    }

    public record GenerateRoutineRequest(
        Guid UserId,
        int DaysPerWeek,
        string FocusArea,
        string EquipmentType,
        string? ExtraNotes
    );

    private static async Task<IResult> GenerateOptimalRoutine(
        [FromBody] GenerateRoutineRequest request,
        AppDbContext dbContext,
        GeminiCoachService coachService)
    {
        var user = await GetOrCreateUserAsync(request.UserId, dbContext);

        var generatedPlan = await coachService.GenerateOptimalRoutineAsync(
            user,
            request.DaysPerWeek,
            request.FocusArea,
            request.EquipmentType,
            request.ExtraNotes ?? string.Empty
        );

        if (generatedPlan == null || generatedPlan.Days == null || !generatedPlan.Days.Any())
            return Results.Problem("Yapay zeka antrenman programı oluşturamadı.");

        return Results.Ok(generatedPlan);
    }

    private static async Task<UserProfile> GetOrCreateUserAsync(Guid userId, AppDbContext dbContext)
    {
        var user = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            user = new UserProfile
            {
                Id = userId,
                FullName = "Sporcu",
                Age = 25,
                WeightKg = 80,
                HeightCm = 180,
                FitnessLevel = "Orta",
                PrimaryGoal = "Hipertrofi",
                ChronicInjuries = string.Empty
            };
            dbContext.UserProfiles.Add(user);
            await dbContext.SaveChangesAsync();
        }
        return user;
    }

    // 1. Program Havuzu: Kullanıcının Programlarını Listele
    private static async Task<IResult> GetUserPrograms(Guid userId, AppDbContext dbContext)
    {
        var programs = await dbContext.WorkoutPrograms
            .AsNoTracking()
            .Where(p => p.UserProfileId == userId)
            .OrderByDescending(p => p.IsActive)
            .ThenByDescending(p => p.CreatedAt)
            .Select(p => new WorkoutProgramDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                DaysCount = p.Routines.Count
            })
            .ToListAsync();

        return Results.Ok(programs);
    }

    // 2. Program Havuzu: Yeni Program Oluştur
    private static async Task<IResult> CreateProgram(
        Guid userId,
        [FromBody] CreateProgramRequest request,
        AppDbContext dbContext)
    {
        try
        {
            var user = await GetOrCreateUserAsync(userId, dbContext);

            if (request.SetAsActive)
            {
                var existingActive = await dbContext.WorkoutPrograms
                    .Where(p => p.UserProfileId == user.Id && p.IsActive)
                    .ToListAsync();

                foreach (var p in existingActive)
                {
                    p.IsActive = false;
                }
            }

            var programId = Guid.NewGuid();
            var newProgram = new WorkoutProgram
            {
                Id = programId,
                UserProfileId = user.Id,
                Name = string.IsNullOrWhiteSpace(request.Name) ? "Yeni Antrenman Programı" : request.Name,
                Description = request.Description ?? string.Empty,
                IsActive = request.SetAsActive,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.WorkoutPrograms.Add(newProgram);
            await dbContext.SaveChangesAsync();

            if (request.Plan?.Days != null && request.Plan.Days.Any())
            {
                foreach (var (day, dayIdx) in request.Plan.Days.Select((d, i) => (d, i)))
                {
                    var routineId = Guid.NewGuid();
                    var routine = new WorkoutRoutine
                    {
                        Id = routineId,
                        UserProfileId = user.Id,
                        WorkoutProgramId = programId,
                        DayName = string.IsNullOrWhiteSpace(day.DayName) ? $"Gün {dayIdx + 1}" : day.DayName,
                        DayOrder = day.DayOrder > 0 ? day.DayOrder : dayIdx + 1,
                        IsRestDay = day.IsRestDay,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    dbContext.WorkoutRoutines.Add(routine);

                    if (day.Exercises != null)
                    {
                        foreach (var (ex, idx) in day.Exercises.Select((e, i) => (e, i)))
                        {
                            var routineExercise = new RoutineExercise
                            {
                                Id = Guid.NewGuid(),
                                WorkoutRoutineId = routineId,
                                ExerciseName = string.IsNullOrWhiteSpace(ex.ExerciseName) ? "Egzersiz" : ex.ExerciseName,
                                Sets = ex.Sets > 0 ? ex.Sets : 3,
                                TargetReps = string.IsNullOrWhiteSpace(ex.TargetReps) ? "8-10" : ex.TargetReps,
                                TargetRpe = ex.TargetRpe > 0 ? ex.TargetRpe : 8.0,
                                TargetWeightKg = ex.TargetWeightKg,
                                OrderIndex = idx
                            };

                            dbContext.RoutineExercises.Add(routineExercise);
                        }
                    }
                }

                await dbContext.SaveChangesAsync();
            }

            return Results.Ok(new { ProgramId = newProgram.Id, Message = "Program başarıyla oluşturuldu." });
        }
        catch (Exception ex)
        {
            var errorDetail = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            Console.WriteLine($"[CREATE PROGRAM ERROR] {errorDetail}");
            return Results.Problem(detail: errorDetail, statusCode: 500);
        }
    }

    // 3. Program Havuzu: Belirli Programı Aktif Yap
    private static async Task<IResult> SetActiveProgram(Guid userId, Guid programId, AppDbContext dbContext)
    {
        var programs = await dbContext.WorkoutPrograms
            .Where(p => p.UserProfileId == userId)
            .ToListAsync();

        var target = programs.FirstOrDefault(p => p.Id == programId);
        if (target == null)
            return Results.NotFound("Program bulunamadı.");

        foreach (var p in programs)
        {
            p.IsActive = (p.Id == programId);
        }

        await dbContext.SaveChangesAsync();
        return Results.Ok(new { Message = $"'{target.Name}' aktif program yapıldı." });
    }

    // 4. Program Havuzu: Program Sil
    private static async Task<IResult> DeleteProgram(Guid userId, Guid programId, AppDbContext dbContext)
    {
        var program = await dbContext.WorkoutPrograms
            .Include(p => p.Routines)
            .ThenInclude(r => r.Exercises)
            .FirstOrDefaultAsync(p => p.UserProfileId == userId && p.Id == programId);

        if (program == null)
            return Results.NotFound("Program bulunamadı.");

        dbContext.WorkoutPrograms.Remove(program);
        await dbContext.SaveChangesAsync();
        return Results.Ok(new { Message = "Program silindi." });
    }

    // 5. Aktif Programın Rutinlerini Getir
    private static async Task<IResult> GetUserRoutines(Guid userId, AppDbContext dbContext)
    {
        try
        {
            var activeProgram = await dbContext.WorkoutPrograms
                .AsNoTracking()
                .Where(p => p.UserProfileId == userId && p.IsActive)
                .FirstOrDefaultAsync();

            var query = dbContext.WorkoutRoutines
                .AsNoTracking()
                .Include(r => r.Exercises.OrderBy(e => e.OrderIndex))
                .Where(r => r.UserProfileId == userId);

            if (activeProgram != null)
            {
                query = query.Where(r => r.WorkoutProgramId == activeProgram.Id);
            }

            var routines = await query
                .OrderBy(r => r.DayOrder)
                .ToListAsync();

            var dtoList = routines.Select(r => new RoutineDayDto
            {
                Id = r.Id,
                DayName = r.DayName,
                DayOrder = r.DayOrder,
                IsRestDay = r.IsRestDay,
                Exercises = r.Exercises.Select(e => new RoutineExerciseDto
                {
                    Id = e.Id,
                    ExerciseName = e.ExerciseName,
                    Sets = e.Sets,
                    TargetReps = e.TargetReps,
                    TargetRpe = e.TargetRpe,
                    TargetWeightKg = e.TargetWeightKg,
                    OrderIndex = e.OrderIndex
                }).ToList()
            }).ToList();

            return Results.Ok(dtoList);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Rutinler çekilirken hata: {ex.Message}");
        }
    }

    // 6. Haftalık Planı Kaydet (Aktif Programı Günceller veya Oluşturur)
    private static async Task<IResult> SaveUserRoutine(
        Guid userId,
        [FromBody] SaveWeeklyPlanRequest request,
        AppDbContext dbContext)
    {
        try
        {
            var user = await GetOrCreateUserAsync(userId, dbContext);

            var activeProgram = await dbContext.WorkoutPrograms
                .FirstOrDefaultAsync(p => p.UserProfileId == user.Id && p.IsActive);

            if (activeProgram == null)
            {
                activeProgram = new WorkoutProgram
                {
                    Id = Guid.NewGuid(),
                    UserProfileId = user.Id,
                    Name = "Birincil Antrenman Programı",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                dbContext.WorkoutPrograms.Add(activeProgram);
                await dbContext.SaveChangesAsync();
            }

            var existingRoutines = await dbContext.WorkoutRoutines
                .Where(r => r.WorkoutProgramId == activeProgram.Id)
                .Include(r => r.Exercises)
                .ToListAsync();

            if (existingRoutines.Any())
            {
                dbContext.WorkoutRoutines.RemoveRange(existingRoutines);
                await dbContext.SaveChangesAsync();
            }

            foreach (var (day, dayIdx) in request.Days.Select((d, i) => (d, i)))
            {
                var newRoutine = new WorkoutRoutine
                {
                    Id = Guid.NewGuid(),
                    UserProfileId = user.Id,
                    WorkoutProgramId = activeProgram.Id,
                    DayName = day.DayName,
                    DayOrder = day.DayOrder > 0 ? day.DayOrder : dayIdx + 1,
                    IsRestDay = day.IsRestDay,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    Exercises = day.Exercises.Select((e, idx) => new RoutineExercise
                    {
                        Id = Guid.NewGuid(),
                        ExerciseName = e.ExerciseName,
                        Sets = e.Sets,
                        TargetReps = string.IsNullOrWhiteSpace(e.TargetReps) ? "8-10" : e.TargetReps,
                        TargetRpe = e.TargetRpe > 0 ? e.TargetRpe : 8.0,
                        TargetWeightKg = e.TargetWeightKg,
                        OrderIndex = idx
                    }).ToList()
                };

                dbContext.WorkoutRoutines.Add(newRoutine);
            }

            await dbContext.SaveChangesAsync();
            return Results.Ok(new { message = "Haftalık antrenman planı güncellendi." });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Rutin kaydedilirken hata: {ex.Message} -> {ex.InnerException?.Message}");
        }
    }

    // 7. Check-In & AI Adaptasyonu
    private static async Task<IResult> AdaptWorkout(
        [FromQuery] Guid userId,
        [FromBody] CheckInRequest request,
        AppDbContext dbContext,
        GeminiCoachService coachService)
    {
        var user = await GetOrCreateUserAsync(userId, dbContext);

        var checkIn = new DailyCheckIn
        {
            UserProfileId = user.Id,
            SleepHours = request.SleepHours,
            EnergyLevel = request.EnergyLevel,
            MuscleSoreness = request.MuscleSoreness,
            PainNotes = request.PainNotes ?? string.Empty,
            CheckInDate = DateTime.UtcNow
        };
        dbContext.DailyCheckIns.Add(checkIn);

        WorkoutRoutine? targetRoutine = null;
        if (request.RoutineDayId.HasValue)
        {
            targetRoutine = await dbContext.WorkoutRoutines
                .Include(r => r.Exercises.OrderBy(e => e.OrderIndex))
                .FirstOrDefaultAsync(r => r.Id == request.RoutineDayId.Value && r.UserProfileId == userId);
        }

        if (targetRoutine == null)
        {
            var activeProgramId = await dbContext.WorkoutPrograms
                .Where(p => p.UserProfileId == userId && p.IsActive)
                .Select(p => (Guid?)p.Id)
                .FirstOrDefaultAsync();

            var query = dbContext.WorkoutRoutines
                .Include(r => r.Exercises.OrderBy(e => e.OrderIndex))
                .Where(r => r.UserProfileId == userId && !r.IsRestDay);

            if (activeProgramId.HasValue)
            {
                query = query.Where(r => r.WorkoutProgramId == activeProgramId.Value);
            }

            targetRoutine = await query.OrderBy(r => r.DayOrder).FirstOrDefaultAsync();
        }

        string routineText;
        string routineName = targetRoutine?.DayName ?? "İtiş (Push)";

        if (targetRoutine != null && targetRoutine.Exercises.Any())
        {
            var sb = new System.Text.StringBuilder();
            foreach (var ex in targetRoutine.Exercises)
            {
                var weightStr = ex.TargetWeightKg.HasValue && ex.TargetWeightKg.Value > 0
                    ? $" @ {ex.TargetWeightKg.Value} kg"
                    : string.Empty;
                sb.AppendLine($"- {ex.ExerciseName}: {ex.Sets} set x {ex.TargetReps} tekrar{weightStr} (RPE {ex.TargetRpe})");
            }
            routineText = sb.ToString();
        }
        else
        {
            routineText = @"
- Incline Dumbbell Press: 4 set x 8-10 tekrar @ 36 kg (RPE 8.5)
- Overhead Shoulder Press: 3 set x 10 tekrar @ 28 kg (RPE 8)
- Dips: 3 set x 8-10 tekrar (RPE 8)
- Lateral Raise: 4 set x 12-15 tekrar @ 14 kg (RPE 9)";
        }

        // targetRoutine nesnesi burada güvenle servise aktarılıyor:
        var lang = "tr";
        var adaptedResult = await coachService.AdaptWorkoutAsync(user, checkIn, targetRoutine, lang);

        if (adaptedResult == null)
            return Results.Problem("AI adaptasyon çıktısı üretemedi.");

        var jsonOptions = new JsonSerializerOptions
        {
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
            WriteIndented = false
        };

        var workoutLog = new WorkoutLog
        {
            UserProfileId = user.Id,
            RoutineName = routineName,
            OriginalPlanJson = routineText,
            AdaptedPlanJson = JsonSerializer.Serialize(adaptedResult, jsonOptions),
            ReadinessScore = adaptedResult.ReadinessScore,
            WorkoutDate = DateTime.UtcNow
        };
        dbContext.WorkoutLogs.Add(workoutLog);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { workoutLogId = workoutLog.Id, routineName = routineName, adaptation = adaptedResult });
    }

    // 8. Koç Chat
    private static async Task<IResult> ChatWithCoach(
    [FromBody] CoachChatRequest request,
    AppDbContext dbContext,
    GeminiCoachService coachService)
{

    if (!request.UserId.HasValue || request.UserId.Value == Guid.Empty)
    return Results.BadRequest("UserId is required.");

var user = await GetOrCreateUserAsync(request.UserId.Value, dbContext);

    // 1. Kullanıcının mesajını DB'ye kaydet
    var userMsg = new CoachChatMessage
    {
        UserProfileId = user.Id,
        Sender = "user",
        Message = request.Message,
        CreatedAt = DateTime.UtcNow
    };
    dbContext.CoachChatMessages.Add(userMsg);
    await dbContext.SaveChangesAsync();

    // 2. Güncel antrenman bağlamını çek
    var latestLog = await dbContext.WorkoutLogs
        .Where(w => w.UserProfileId == user.Id)
        .OrderByDescending(w => w.WorkoutDate)
        .FirstOrDefaultAsync();

    // 3. AI cevabını ve varsa bahsedilen sakatlığı üret
    var chatResult = await coachService.AskCoachAsync(user, latestLog, request.Message);

    // 4. Otomatik Sakatlık/Kısıt Kaydı: Chat'te sakatlık geçtiyse UserProfile'a işle
    if (!string.IsNullOrWhiteSpace(chatResult.DetectedInjuryOrLimitation))
    {
        if (string.IsNullOrWhiteSpace(user.ChronicInjuries))
        {
            user.ChronicInjuries = chatResult.DetectedInjuryOrLimitation;
        }
        else if (!user.ChronicInjuries.Contains(chatResult.DetectedInjuryOrLimitation, StringComparison.OrdinalIgnoreCase))
        {
            user.ChronicInjuries += $", {chatResult.DetectedInjuryOrLimitation}";
        }
        await dbContext.SaveChangesAsync();
    }

    // 5. Koçun cevabını DB'ye kaydet (.Reply kullanıyoruz)
    var coachMsg = new CoachChatMessage
    {
        UserProfileId = user.Id,
        Sender = "coach",
        Message = chatResult.Reply,
        CreatedAt = DateTime.UtcNow
    };
    dbContext.CoachChatMessages.Add(coachMsg);
    await dbContext.SaveChangesAsync();

    return Results.Ok(new CoachChatResponse { Reply = chatResult.Reply });
}

    // 9. Geçmiş Seanslar
    private static async Task<IResult> GetHistory(
        Guid? userId,
        ClaimsPrincipal claimsUser,
        AppDbContext dbContext)
    {
        if (!userId.HasValue || userId == Guid.Empty)
        {
            var idStr = claimsUser.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(idStr, out var parsedId))
            {
                userId = parsedId;
            }
        }

        if (!userId.HasValue || userId == Guid.Empty)
        {
            return Results.Unauthorized();
        }

        var logs = await dbContext.WorkoutLogs
            .Where(w => w.UserProfileId == userId.Value)
            .OrderByDescending(w => w.WorkoutDate)
            .Take(10)
            .ToListAsync();

        var history = logs.Select(log => new WorkoutHistoryResponse
        {
            Id = log.Id,
            RoutineName = log.RoutineName,
            ReadinessScore = log.ReadinessScore,
            WorkoutDate = log.WorkoutDate,
            AdaptedPlan = JsonSerializer.Deserialize<object>(log.AdaptedPlanJson)
        });

        return Results.Ok(history);
    }

    // 10. Bugünün Durumu
    private static async Task<IResult> GetTodayStatus(Guid userId, AppDbContext dbContext)
    {
        var todayUtc = DateTime.UtcNow.Date;
        var todayLog = await dbContext.WorkoutLogs
            .Where(w => w.UserProfileId == userId && w.WorkoutDate >= todayUtc)
            .OrderByDescending(w => w.WorkoutDate)
            .FirstOrDefaultAsync();

        if (todayLog == null)
            return Results.Ok(new { hasCheckedInToday = false, message = "Bugün henüz check-in yapılmadı." });

        return Results.Ok(new
        {
            hasCheckedInToday = true,
            workoutLogId = todayLog.Id,
            routineName = todayLog.RoutineName,
            readinessScore = todayLog.ReadinessScore,
            adaptedPlan = JsonSerializer.Deserialize<object>(todayLog.AdaptedPlanJson)
        });
    }

    // 11. Progressive Overload & Deload Analiz Motoru
    private static async Task<IResult> GetOverloadAdvice(Guid userId, AppDbContext dbContext)
    {
        var recentCheckIns = await dbContext.DailyCheckIns
            .Where(c => c.UserProfileId == userId)
            .OrderByDescending(c => c.CheckInDate)
            .Take(5)
            .ToListAsync();

        bool recommendDeload = false;
        string fatigueSummary = "Toparlanma dengeli seyrediyor. Normal aşamalı yük bindirme devam edebilir.";

        if (recentCheckIns.Count >= 3)
        {
            var avgSoreness = recentCheckIns.Average(c => c.MuscleSoreness);
            var avgEnergy = recentCheckIns.Average(c => c.EnergyLevel);

            if (avgSoreness >= 7.5 || avgEnergy <= 4.0)
            {
                recommendDeload = true;
                fatigueSummary = "Son günlerde yüksek kas ağrısı (DOMS) ve düşük enerji seviyesi tespit edildi. Merkezi sinir sistemi toparlanması için Deload / hafif yük önerilir.";
            }
        }

        var activeProgramId = await dbContext.WorkoutPrograms
            .Where(p => p.UserProfileId == userId && p.IsActive)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync();

        var routines = await dbContext.WorkoutRoutines
            .Include(r => r.Exercises)
            .Where(r => r.UserProfileId == userId && (activeProgramId == null || r.WorkoutProgramId == activeProgramId))
            .ToListAsync();

        var allExercises = routines
            .SelectMany(r => r.Exercises)
            .Where(e => (e.TargetWeightKg ?? 0) > 0)
            .ToList();

        var advices = new List<ProgressiveOverloadAdvice>();

        foreach (var ex in allExercises)
        {
            var currentWeight = ex.TargetWeightKg!.Value;
            string nameLower = (ex.ExerciseName ?? string.Empty).ToLowerInvariant();

            if (recommendDeload)
            {
                advices.Add(new ProgressiveOverloadAdvice
                {
                    ExerciseName = ex.ExerciseName,
                    CurrentWeightKg = currentWeight,
                    RecommendedWeightKg = Math.Round(currentWeight * 0.85, 1),
                    Action = "DELOAD",
                    Reason = "Sistemik yorgunluk birikimi sebebiyle eklemleri rahatlatmak için ağırlık %15 düşürüldü."
                });
                continue;
            }

            bool isCompound = nameLower.Contains("press") ||
                              nameLower.Contains("squat") ||
                              nameLower.Contains("deadlift") ||
                              nameLower.Contains("row");

            double increment = isCompound ? 2.5 : 1.0;

            advices.Add(new ProgressiveOverloadAdvice
            {
                ExerciseName = ex.ExerciseName,
                CurrentWeightKg = currentWeight,
                RecommendedWeightKg = currentWeight + increment,
                Action = "INCREASE",
                Reason = isCompound
                    ? $"Bileşik hareket için mikroyükleme kuralı (+{increment} kg artış ile mekanik gerilim artırımı)."
                    : $"İzolasyon hareketi için güvenli hipertrofi artışı (+{increment} kg)."
            });
        }

        return Results.Ok(new ProgramOverloadAnalysisResponse
        {
            IsDeloadRecommended = recommendDeload,
            FatigueSummary = fatigueSummary,
            Advices = advices
        });
    }
    public record LogExerciseWeightDto(string ExerciseName, double LoggedWeightKg);
    public record LogWorkoutWeightsRequest(List<LogExerciseWeightDto> Weights);

    private static async Task<IResult> LogWorkoutWeights(
        Guid userId,
        [FromBody] LogWorkoutWeightsRequest request,
        AppDbContext dbContext)
    {
        var activeProgramId = await dbContext.WorkoutPrograms
            .Where(p => p.UserProfileId == userId && p.IsActive)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync();

        var routines = await dbContext.WorkoutRoutines
            .Include(r => r.Exercises)
            .Where(r => r.UserProfileId == userId && (activeProgramId == null || r.WorkoutProgramId == activeProgramId))
            .ToListAsync();

        foreach (var item in request.Weights)
        {
            var ex = routines
                .SelectMany(r => r.Exercises)
                .FirstOrDefault(e => e.ExerciseName.Trim().ToLowerInvariant() == item.ExerciseName.Trim().ToLowerInvariant());

            if (ex != null && item.LoggedWeightKg > 0)
            {
                ex.TargetWeightKg = item.LoggedWeightKg;
            }
        }

        await dbContext.SaveChangesAsync();
        return Results.Ok(new { message = "Antrenman ağırlıkları başarıyla kaydedildi. Bir sonraki seans için yeni baz alındı." });
    }
    // Geçmiş mesajları kronolojik getirme
    private static async Task<IResult> GetChatHistory(Guid userId, AppDbContext dbContext)
    {
        var history = await dbContext.CoachChatMessages
            .Where(m => m.UserProfileId == userId)
            .OrderBy(m => m.CreatedAt)
            .Take(50) // Son 50 mesaj
            .Select(m => new
            {
                m.Id,
                m.Sender,
                m.Message,
                m.CreatedAt
            })
            .ToListAsync();

        return Results.Ok(history);
    }

}