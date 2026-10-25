using System.Security.Claims;
using AdaptivAi.Domain.Entities;
using AdaptivAi.Domain.Models;
using AdaptivAi.Infrastructure;
using AdaptivAi.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using AdaptivAi.Infrastructure.Data;

namespace AdaptivAi.API.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (RegisterRequest req, AppDbContext db, ITokenService tokenService) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return Results.BadRequest(new { message = "Email ve şifre zorunludur." });

            var normalizedEmail = req.Email.Trim().ToLowerInvariant();
            var exists = await db.UserProfiles.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
            if (exists)
                return Results.Conflict(new { message = "Bu e-posta adresi zaten kullanımda." });

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);

            var user = new UserProfile
            {
                Email = normalizedEmail,
                PasswordHash = passwordHash,
                FullName = req.FullName,
                Age = req.Age,
                HeightCm = req.HeightCm,
                WeightKg = req.WeightKg,
                FitnessLevel = string.IsNullOrWhiteSpace(req.FitnessLevel) ? "Orta" : req.FitnessLevel,
                PrimaryGoal = string.IsNullOrWhiteSpace(req.PrimaryGoal) ? "Hipertrofi" : req.PrimaryGoal,
                ChronicInjuries = req.ChronicInjuries
            };

            db.UserProfiles.Add(user);
            await db.SaveChangesAsync();

            var token = tokenService.GenerateToken(user);
            return Results.Ok(new AuthResponse(token, user.Id, user.Email, user.FullName));
        });

        group.MapPost("/login", async (LoginRequest req, AppDbContext db, ITokenService tokenService) =>
        {
            var normalizedEmail = req.Email.Trim().ToLowerInvariant();
            var user = await db.UserProfiles.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Results.Unauthorized();

            var token = tokenService.GenerateToken(user);
            return Results.Ok(new AuthResponse(token, user.Id, user.Email, user.FullName));
        });

        group.MapGet("/me", async (ClaimsPrincipal claimsUser, AppDbContext db) =>
        {
            var userIdStr = claimsUser.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Results.Unauthorized();

            var user = await db.UserProfiles.FindAsync(userId);
            if (user == null) return Results.NotFound();

            return Results.Ok(new UserProfileDto(
                user.Id,
                user.Email,
                user.FullName,
                user.Age,
                user.HeightCm,
                user.WeightKg,
                user.FitnessLevel,
                user.PrimaryGoal,
                user.ChronicInjuries
            ));
        }).RequireAuthorization();
    }
}