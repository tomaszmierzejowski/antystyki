@echo off
REM Antystics Quick Start Script for Windows

echo Starting Antystics...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Docker Compose is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist "frontend\.env" (
    echo Creating frontend\.env file...
    copy "frontend\.env.example" "frontend\.env"
    echo Created frontend\.env - you may want to customize it
)

REM Build and start containers
echo Building and starting containers...
docker-compose up -d

REM Wait for services to be ready
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Antystics is running!
echo.
echo Access the application:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo   Swagger: http://localhost:5000/swagger
echo.
echo Default admin credentials:
echo   Email: admin@antystyki.pl
echo   Password: Admin123!
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause



