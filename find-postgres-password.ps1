# PostgreSQL Password Finder
# This script tests common passwords to find which one works

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PostgreSQL Password Finder for Antystics" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "1. Checking if PostgreSQL is running on port 5432..." -ForegroundColor Yellow
$connection = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $connection) {
    Write-Host "   ❌ PostgreSQL is NOT running on localhost:5432" -ForegroundColor Red
    Write-Host "   Please start PostgreSQL and try again." -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ PostgreSQL is running!" -ForegroundColor Green
Write-Host ""

# Check current user secrets
Write-Host "2. Checking your current user secrets..." -ForegroundColor Yellow
Push-Location "backend\Antystics.Api"
$secrets = dotnet user-secrets list 2>&1 | Out-String

if ($secrets -match "ConnectionStrings:DefaultConnection = (.+)") {
    $currentConnString = $Matches[1]
    if ($currentConnString -match "Password=([^;]+)") {
        $currentPassword = $Matches[1]
        Write-Host "   Current password in secrets: '$currentPassword'" -ForegroundColor White
    }
}
Pop-Location
Write-Host ""

# Test connection using .NET
Write-Host "3. Testing PostgreSQL connection..." -ForegroundColor Yellow
Write-Host ""

$testPasswords = @("Quake112", "postgres", "admin", "password", "123456", "")

$foundPassword = $null

foreach ($pwd in $testPasswords) {
    $displayPwd = if ($pwd -eq "") { "(empty password)" } else { "'$pwd'" }
    Write-Host "   Testing password: $displayPwd" -ForegroundColor Gray
    
    # Create a simple C# program to test connection
    $testCode = @"
using System;
using Npgsql;

try
{
    var connString = "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=$pwd;Timeout=5";
    using var conn = new NpgsqlConnection(connString);
    conn.Open();
    Console.WriteLine("SUCCESS");
}
catch (Exception ex)
{
    Console.WriteLine("FAILED:" + ex.Message);
}
"@

    # Save test code to temp file
    $testFile = [System.IO.Path]::GetTempFileName() + ".cs"
    $testCode | Out-File -FilePath $testFile -Encoding UTF8
    
    # Compile and run
    $result = dotnet script $testFile 2>&1 | Out-String
    
    if ($result -match "SUCCESS") {
        $foundPassword = $pwd
        Write-Host "   ✅ SUCCESS! Found working password: $displayPwd" -ForegroundColor Green
        Remove-Item $testFile -ErrorAction SilentlyContinue
        break
    }
    else {
        Write-Host "   ❌ Failed" -ForegroundColor DarkGray
    }
    
    Remove-Item $testFile -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan

if ($null -ne $foundPassword) {
    $displayPwd = if ($foundPassword -eq "") { "(empty)" } else { $foundPassword }
    Write-Host "  ✅ FOUND IT!" -ForegroundColor Green
    Write-Host "  Your PostgreSQL password is: $displayPwd" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Now update your user secrets:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "cd backend\Antystics.Api" -ForegroundColor White
    Write-Host "dotnet user-secrets set `"ConnectionStrings:DefaultConnection`" `"Host=localhost;Port=5432;Database=antystics;Username=postgres;Password=$foundPassword;Include Error Detail=true`"" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host "  ❌ Could not find the password" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL requires a password not in the common list" -ForegroundColor White
    Write-Host "  2. The postgres user doesn't exist" -ForegroundColor White
    Write-Host "  3. PostgreSQL is configured to reject connections" -ForegroundColor White
    Write-Host ""
    Write-Host "What to do:" -ForegroundColor Yellow
    Write-Host "  1. Open pgAdmin and try to connect" -ForegroundColor White
    Write-Host "  2. Check PostgreSQL logs for auth errors" -ForegroundColor White
    Write-Host "  3. Reset the postgres password using pgAdmin" -ForegroundColor White
    Write-Host ""
}

