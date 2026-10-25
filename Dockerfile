# 1. Build Aşaması
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Sadece proje dosyalarını çekip paketleri restore et (Docker cache avantajı)
COPY ["AdaptivAi.API/AdaptivAi.API.csproj", "AdaptivAi.API/"]
COPY ["AdaptivAi.Domain/AdaptivAi.Domain.csproj", "AdaptivAi.Domain/"]
COPY ["AdaptivAi.Infrastructure/AdaptivAi.Infrastructure.csproj", "AdaptivAi.Infrastructure/"]

RUN dotnet restore "AdaptivAi.API/AdaptivAi.API.csproj"

# Kalan tüm kaynak kodları kopyala ve derle
COPY . .
WORKDIR "/src/AdaptivAi.API"
RUN dotnet publish "AdaptivAi.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Çalışma Aşaması (Hafif ASP.NET Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render'ın portunu dinle
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "AdaptivAi.API.dll"]