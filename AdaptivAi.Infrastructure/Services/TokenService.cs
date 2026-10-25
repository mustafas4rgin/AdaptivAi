using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AdaptivAi.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

// Tip çakışmasını kökten kesmek için alias:
using Claim = System.Security.Claims.Claim;

namespace AdaptivAi.Infrastructure.Services;

public interface ITokenService
{
    string GenerateToken(UserProfile user);
}

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(UserProfile user)
    {
        var secretKey = _config["Jwt:Key"] ?? "AdaptivAi_Very_Long_And_Super_Secret_Security_Key_2026_AI!";
        var issuer = _config["Jwt:Issuer"] ?? "AdaptivAiAPI";
        var audience = _config["Jwt:Audience"] ?? "AdaptivAiClient";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.Name, user.FullName ?? string.Empty)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}