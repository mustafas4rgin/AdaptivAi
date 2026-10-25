namespace AdaptivAi.Domain.Models;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    int Age,
    decimal HeightCm,
    decimal WeightKg,
    string FitnessLevel,
    string PrimaryGoal,
    string? ChronicInjuries
);

public record LoginRequest(
    string Email,
    string Password
);

public record AuthResponse(
    string Token,
    Guid UserId,
    string Email,
    string FullName
);

public record UserProfileDto(
    Guid Id,
    string Email,
    string FullName,
    int Age,
    decimal HeightCm,
    decimal WeightKg,
    string FitnessLevel,
    string PrimaryGoal,
    string? ChronicInjuries
);