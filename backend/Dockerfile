# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["Antystics.sln", "./"]
COPY ["Antystics.Api/Antystics.Api.csproj", "Antystics.Api/"]
COPY ["Antystics.Core/Antystics.Core.csproj", "Antystics.Core/"]
COPY ["Antystics.Infrastructure/Antystics.Infrastructure.csproj", "Antystics.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "Antystics.sln"

# Copy everything else and build
COPY . .
WORKDIR "/src/Antystics.Api"
RUN dotnet build "Antystics.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Antystics.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install dependencies for ImageSharp
RUN apt-get update && apt-get install -y \
    libgdiplus \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .

# Create uploads directory
RUN mkdir -p /app/wwwroot/uploads

EXPOSE 8080

ENTRYPOINT ["dotnet", "Antystics.Api.dll"]



