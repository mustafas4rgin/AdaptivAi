using AdaptivAi.API.Endpoints;
using AdaptivAi.Infrastructure.Data;
using AdaptivAi.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. PostgreSQL Bağlantısı
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("AdaptivAi.Infrastructure")));

// 2. Gemini Servisi Kaydı
builder.Services.AddHttpClient<GeminiCoachService>();

// 3. Swagger Dokümantasyonu
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 4. CORS Politikası
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowViteApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// CORS en tepede ve sadece 1 kere olmalı
app.UseCors("AllowViteApp");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Development ortamında HTTP isteklerini bozmaması için HttpsRedirection'ı kapatalım veya pasife alalım
// app.UseHttpsRedirection();

// Tüm Coach Endpoint'lerini bağla
app.MapCoachEndpoints();

app.Run();