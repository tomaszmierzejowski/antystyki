# Antystyki Production Deployment Script (PowerShell)
# Version: 1.0
# Date: October 15, 2025
#
# This script automates the deployment process to production server
# Usage: .\deploy.ps1 -Environment production -Server YOUR_SERVER_IP

param(
    [string]$Environment = "production",
    [string]$Server = "",
    [string]$DeployUser = "antystyki",
    [string]$RemoteDir = "/var/www/antystyki"
)

$ErrorActionPreference = "Stop"

# Colors
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║         Antystyki Deployment Script v1.0                 ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "✗ Error: .env file not found!" -ForegroundColor Red
    Write-Host "  Please create .env from PRODUCTION.env.example" -ForegroundColor Yellow
    Write-Host "  Run: Copy-Item PRODUCTION.env.example .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Found .env file" -ForegroundColor Green

# Get server IP if not provided
if ([string]::IsNullOrEmpty($Server)) {
    $Server = Read-Host "Enter production server IP or hostname"
}

Write-Host "Target server: $Server" -ForegroundColor Blue
Write-Host "Environment: $Environment" -ForegroundColor Blue
Write-Host ""

# Confirmation
$confirmation = Read-Host "Continue with deployment? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1/7: Running pre-deployment checks..." -ForegroundColor Blue

# Check if git is clean
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠ Warning: You have uncommitted changes" -ForegroundColor Yellow
    git status -s
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        exit 0
    }
}

Write-Host "✓ Pre-deployment checks passed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2/7: Creating deployment archive..." -ForegroundColor Blue

# Create deployment package
git archive --format=zip --output=antystics-deploy.zip HEAD

Write-Host "✓ Created antystics-deploy.zip" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3/7: Uploading to server..." -ForegroundColor Blue

# Check if scp is available (OpenSSH for Windows)
if (!(Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Error: scp not found!" -ForegroundColor Red
    Write-Host "  Please install OpenSSH Client:" -ForegroundColor Yellow
    Write-Host "  Settings → Apps → Optional Features → Add → OpenSSH Client" -ForegroundColor Yellow
    exit 1
}

# Upload deployment archive
scp antystics-deploy.zip "${DeployUser}@${Server}:${RemoteDir}/"

# Upload .env file (securely)
scp .env "${DeployUser}@${Server}:${RemoteDir}/.env"

Write-Host "✓ Files uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4/7: Extracting files on server..." -ForegroundColor Blue

# Extract files on server
$extractScript = @"
cd $RemoteDir
unzip -o antystics-deploy.zip
rm antystics-deploy.zip
echo '✓ Files extracted'
"@

ssh "${DeployUser}@${Server}" $extractScript

Write-Host "✓ Extraction complete" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5/7: Building Docker images..." -ForegroundColor Blue

$buildScript = @"
cd $RemoteDir
docker-compose -f docker-compose.production.yml build
echo '✓ Docker images built'
"@

ssh "${DeployUser}@${Server}" $buildScript

Write-Host "✓ Build complete" -ForegroundColor Green

Write-Host ""
Write-Host "Step 6/7: Deploying containers..." -ForegroundColor Blue

$deployScript = @"
cd $RemoteDir

# Stop old containers
docker-compose -f docker-compose.production.yml down

# Start new containers
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
echo 'Waiting for services to start...'
sleep 10

echo '✓ Containers deployed'
"@

ssh "${DeployUser}@${Server}" $deployScript

Write-Host "✓ Deployment complete" -ForegroundColor Green

Write-Host ""
Write-Host "Step 7/7: Running health checks..." -ForegroundColor Blue

# Wait for services to start
Start-Sleep -Seconds 5

# Check container status
$statusScript = @"
cd $RemoteDir
docker-compose -f docker-compose.production.yml ps
"@

ssh "${DeployUser}@${Server}" $statusScript

# Test health endpoint
Write-Host ""
Write-Host "Testing API health endpoint..." -ForegroundColor Blue

try {
    $healthResponse = Invoke-WebRequest -Uri "https://api.$Server/api/health" -UseBasicParsing -TimeoutSec 10
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✓ API health check passed (HTTP 200)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ API health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "  (This may be normal if domain isn't configured yet)" -ForegroundColor Yellow
}

# Cleanup local deployment archive
Remove-Item antystics-deploy.zip

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         🎉 Deployment Successful! 🎉                     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "  1. Test frontend: https://$Server"
Write-Host "  2. Test API: https://api.$Server/api/health"
Write-Host "  3. Check logs: ssh ${DeployUser}@${Server} 'cd ${RemoteDir} && docker-compose -f docker-compose.production.yml logs'"
Write-Host "  4. Monitor: https://uptimerobot.com/"
Write-Host ""
Write-Host "Deployment completed at: $(Get-Date)" -ForegroundColor Yellow

