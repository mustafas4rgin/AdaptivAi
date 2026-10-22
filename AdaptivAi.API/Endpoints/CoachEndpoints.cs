using System.Text.Json;
using AdaptivAi.API.DTOs;
using AdaptivAi.Domain.Entities;
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

        group.MapPost("/check-in-and-adapt", AdaptWorkout).WithName("CheckInAndAdapt");
        group.MapPost("/chat", ChatWithCoach).WithName("CoachChat");
        group.MapGet("/history/{userId:guid}", GetHistory).WithName("GetWorkoutHistory");
        group.MapGet("/today/{userId:guid}", GetTodayStatus).WithName("GetTodayStatus");

        // Rutin Yönetimi Endpoint'leri
        group.MapGet("/routines/{userId:guid}", GetUserRoutines).WithName("GetUserRoutines");
        group.MapPost("/routines/{userId:guid}", SaveUserRoutine).WithName("SaveUserRoutine");

        return group;
    }

    // 1. Check-In & Adaptasyon (Dinamik DB Rutini ile)
    // 1. Check-In & Adaptasyon (Seçilen Güne Göre)
    private static async Task<IResult> AdaptWorkout(
        [FromQuery] Guid userId,
        [FromBody] CheckInRequest request,
        AppDbContext dbContext,
        GeminiCoachService coachService)
    {
        var user = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
            return Results.NotFound(new { message = "Kullanıcı bulunamadı." });

        var checkIn = new DailyCheckIn
        {
            UserProfileId = user.Id,
            SleepHours = request.SleepHours,
            EnergyLevel = request.EnergyLevel,
            MuscleSoreness = request.MuscleSoreness,
            PainNotes = request.PainNotes,
            CheckInDate = DateTime.UtcNow
        };
        dbContext.DailyCheckIns.Add(checkIn);

        // Kullanıcının seçtiği günü bul, seçmediyse 1. günü al
        WorkoutRoutine? targetRoutine = null;
        if (request.RoutineDayId.HasValue)
        {
            targetRoutine = await dbContext.WorkoutRoutines
                .Include(r => r.Exercises.OrderBy(e => e.OrderIndex))
                .FirstOrDefaultAsync(r => r.Id == request.RoutineDayId.Value && r.UserProfileId == userId);
        }

        if (targetRoutine == null)
        {
            targetRoutine = await dbContext.WorkoutRoutines
                .Include(r => r.Exercises.OrderBy(e => e.OrderIndex))
                .Where(r => r.UserProfileId == userId && !r.IsRestDay)
                .OrderBy(r => r.DayOrder)
                .FirstOrDefaultAsync();
        }

        string routineText;
        string routineName = targetRoutine?.DayName ?? "Özel Seans";

        if (targetRoutine != null && targetRoutine.Exercises.Any())
        {
            var sb = new System.Text.StringBuilder();
            foreach (var ex in targetRoutine.Exercises)
            {
                sb.AppendLine($"- {ex.ExerciseName}: {ex.Sets} set x {ex.TargetReps} tekrar (RPE {ex.TargetRpe})");
            }
            routineText = sb.ToString();
        }
        else
        {
            routineText = @"
- Barbell Back Squat: 4 set x 6-8 tekrar (RPE 8)
- Romanian Deadlift: 3 set x 8-10 tekrar (RPE 8)
- Leg Press: 3 set x 10-12 tekrar (RPE 8.5)
- Standing Calf Raise: 4 set x 12-15 tekrar (RPE 9)";
        }

        var prompt = coachService.BuildDynamicPrompt(user, checkIn, routineText);
        var adaptedResult = await coachService.AdaptWorkoutAsync(prompt);

        if (adaptedResult is null)
            return Results.Problem("AI adaptasyon çıktısı üretemedi.");

        var workoutLog = new WorkoutLog
        {
            UserProfileId = user.Id,
            RoutineName = routineName,
            OriginalPlanJson = routineText,
            AdaptedPlanJson = JsonSerializer.Serialize(adaptedResult),
            ReadinessScore = adaptedResult.ReadinessScore,
            WorkoutDate = DateTime.UtcNow
        };
        dbContext.WorkoutLogs.Add(workoutLog);
        await dbContext.SaveChangesAsync();

        return Results.Ok(new { workoutLogId = workoutLog.Id, routineName = routineName, adaptation = adaptedResult });
    }

    // 2. Kullanıcının Tüm Haftalık Split'ini Getir
    // 2. Kullanıcının Tüm Haftalık Split'ini Getir
    private static async Task<IResult> GetUserRoutines(Guid userId, AppDbContext dbContext)
    {
        try
        {
            var routines = await dbContext.WorkoutRoutines
                .AsNoTracking()
                .Where(r => r.UserProfileId == userId)
                .OrderBy(r => r.DayOrder)
                .Include(r => r.Exercises.OrderBy(e => e.OrderIndex))
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

    // 3. Haftalık Planı Toplu Kaydet
    // 3. Haftalık Planı Toplu Kaydet
    private static async Task<IResult> SaveUserRoutine(
        Guid userId,
        [FromBody] SaveWeeklyPlanRequest request,
        AppDbContext dbContext)
    {
        try
        {
            var user = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return Results.NotFound(new { message = "Kullanıcı profili bulunamadı." });
            }

            // Önceki rutinleri ve ilişkili egzersizleri temizle
            var existingRoutines = await dbContext.WorkoutRoutines
                .Where(r => r.UserProfileId == userId)
                .Include(r => r.Exercises)
                .ToListAsync();

            if (existingRoutines.Any())
            {
                dbContext.WorkoutRoutines.RemoveRange(existingRoutines);
                await dbContext.SaveChangesAsync();
            }

            // Yeni planı oluştur
            foreach (var day in request.Days)
            {
                var newRoutine = new WorkoutRoutine
                {
                    Id = Guid.NewGuid(),
                    UserProfileId = userId,
                    DayName = day.DayName,
                    DayOrder = day.DayOrder,
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
    // Chat, History ve Today metodları aynı şekilde kalıyor
    private static async Task<IResult> ChatWithCoach(
        [FromBody] CoachChatRequest request,
        AppDbContext dbContext,
        GeminiCoachService coachService)
    {
        var user = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user is null) return Results.NotFound(new { message = "Kullanıcı bulunamadı." });

        var latestLog = await dbContext.WorkoutLogs
            .Where(w => w.UserProfileId == user.Id)
            .OrderByDescending(w => w.WorkoutDate)
            .FirstOrDefaultAsync();

        var coachReply = await coachService.AskCoachAsync(user, latestLog, request.Message);
        return Results.Ok(new CoachChatResponse { Reply = coachReply });
    }

    private static async Task<IResult> GetHistory(Guid userId, AppDbContext dbContext)
    {
        var logs = await dbContext.WorkoutLogs
            .Where(w => w.UserProfileId == userId)
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

    private static async Task<IResult> GetTodayStatus(Guid userId, AppDbContext dbContext)
    {
        var todayUtc = DateTime.UtcNow.Date;
        var todayLog = await dbContext.WorkoutLogs
            .Where(w => w.UserProfileId == userId && w.WorkoutDate >= todayUtc)
            .OrderByDescending(w => w.WorkoutDate)
            .FirstOrDefaultAsync();

        if (todayLog is null)
            return Results.Ok(new { hasCheckedInToday = false, message = "Bugün henüz check-in yapılmadı." });

        return Results.Ok(new
        {
            hasCheckedInToday = true,
            workoutLogId = todayLog.Id,
            readinessScore = todayLog.ReadinessScore,
            adaptedPlan = JsonSerializer.Deserialize<object>(todayLog.AdaptedPlanJson)
        });
    }
}