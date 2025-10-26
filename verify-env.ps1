# Environment Variable Verification Script for Production
# This script checks if all required environment variables are properly set

Write-Host "🔍 Checking Production Environment Variables..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "❌ ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "   Please create .env file from PRODUCTION.env.example" -ForegroundColor Yellow
    Write-Host "   Command: cp PRODUCTION.env.example .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# Load .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Critical variables to check
$criticalVars = @{
    "FRONTEND_URL" = "Frontend URL for email links"
    "POSTGRES_PASSWORD" = "Database password"
    "JWT_SECRET" = "JWT secret key"
    "SMTP_HOST" = "Email SMTP host"
    "SMTP_USER" = "Email SMTP username"
    "SMTP_PASSWORD" = "Email SMTP password"
    "EMAIL_FROM_ADDRESS" = "Email from address"
}

Write-Host ""
Write-Host "📋 Critical Variables Check:" -ForegroundColor Cyan
Write-Host ""

$hasErrors = $false

foreach ($var in $criticalVars.GetEnumerator()) {
    $value = [Environment]::GetEnvironmentVariable($var.Key, "Process")
    
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "❌ $($var.Key)" -ForegroundColor Red -NoNewline
        Write-Host " - NOT SET ($($var.Value))" -ForegroundColor Yellow
        $hasErrors = $true
    }
    elseif ($value -match "PLACEHOLDER|your-|CHANGE|TODO") {
        Write-Host "⚠️  $($var.Key)" -ForegroundColor Yellow -NoNewline
        Write-Host " - Still has placeholder value" -ForegroundColor Yellow
        $hasErrors = $true
    }
    else {
        Write-Host "✅ $($var.Key)" -ForegroundColor Green -NoNewline
        # Mask sensitive values
        if ($var.Key -match "PASSWORD|SECRET") {
            Write-Host " - Set (hidden)" -ForegroundColor Gray
        }
        else {
            $displayValue = if ($value.Length -gt 50) { $value.Substring(0, 47) + "..." } else { $value }
            Write-Host " - $displayValue" -ForegroundColor Gray
        }
    }
}

Write-Host ""

# Special check for FRONTEND_URL format
$frontendUrl = [Environment]::GetEnvironmentVariable("FRONTEND_URL", "Process")
if ($frontendUrl) {
    if ($frontendUrl -match "^https://[a-zA-Z0-9\-\.]+$") {
        Write-Host "✅ FRONTEND_URL format looks correct" -ForegroundColor Green
    }
    elseif ($frontendUrl -match "^http://") {
        Write-Host "⚠️  FRONTEND_URL uses HTTP instead of HTTPS" -ForegroundColor Yellow
        Write-Host "   For production, use: https://antystyki.pl" -ForegroundColor Yellow
    }
    else {
        Write-Host "❌ FRONTEND_URL format is invalid: $frontendUrl" -ForegroundColor Red
        Write-Host "   Expected format: https://antystyki.pl" -ForegroundColor Yellow
        $hasErrors = $true
    }
}

Write-Host ""

if ($hasErrors) {
    Write-Host "❌ Configuration has errors. Please fix before deploying." -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 To fix:" -ForegroundColor Yellow
    Write-Host "   1. Edit .env file: notepad .env" -ForegroundColor White
    Write-Host "   2. Update the values marked with ❌ or ⚠️" -ForegroundColor White
    Write-Host "   3. Run this script again to verify" -ForegroundColor White
    exit 1
}
else {
    Write-Host "✅ All critical variables are properly configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to deploy!" -ForegroundColor Cyan
}

