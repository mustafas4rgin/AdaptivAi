using System.Text;
using AdaptivAi.API.Endpoints;
using AdaptivAi.Infrastructure.Data;
using AdaptivAi.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. PostgreSQL Bağlantısı
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("AdaptivAi.Infrastructure")));

// 2. Servis Kayıtları
builder.Services.AddHttpClient<GeminiCoachService>();
builder.Services.AddScoped<ITokenService, TokenService>();

// 3. JWT Kimlik Doğrulama
var jwtKey = builder.Configuration["Jwt:Key"] ?? "AdaptivAi_Very_Long_And_Super_Secret_Security_Key_2026_AI!";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "AdaptivAiAPI",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AdaptivAiClient",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

// 4. Swagger Dokümantasyonu (Sadeleştirilmiş)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 5. CORS Politikası (Vercel ve Localhost erişimleri)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowViteApp", policy =>
    {
        policy.WithOrigins(
                "https://adaptiv-ai-mocha.vercel.app",
                "http://localhost:5173",
                "https://localhost:5173"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// CORS mutlaka Authentication ve Authorization öncesinde çalışmalıdır
app.UseCors("AllowViteApp");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

// Endpoint Bağlantıları
app.MapAuthEndpoints();
app.MapCoachEndpoints();

app.Run();