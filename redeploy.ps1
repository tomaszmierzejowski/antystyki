# ============================================================================
# Antystyki Quick Redeploy Script (PowerShell)
# ============================================================================
# This script redeploys the application with the SPA fallback fix
# Usage: .\redeploy.ps1 -Server SERVER_IP
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Server,
    
    [string]$User = "antystyki",
    [string]$ProjectDir = "/var/www/antystyki"
)

$ErrorActionPreference = "Stop"

# Colors
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "======================================" "Cyan"
Write-ColorOutput "  Antystyki Deployment Script" "Cyan"
Write-ColorOutput "======================================" "Cyan"
Write-Host ""
Write-ColorOutput "Server: $User@$Server" "Yellow"
Write-ColorOutput "Project: $ProjectDir" "Yellow"
Write-Host ""

# Function to run SSH command
function Invoke-SSH {
    param([string]$Command)
    
    $sshCmd = "ssh -o ConnectTimeout=10 $User@$Server `"$Command`""
    $result = Invoke-Expression $sshCmd 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "SSH command failed: $Command"
    }
    
    return $result
}

try {
    # Step 1: Test connection
    Write-ColorOutput "[1/8] Testing SSH connection..." "Cyan"
    try {
        Invoke-SSH "echo 'Connection successful'" | Out-Null
        Write-ColorOutput "✓ Connected" "Green"
    }
    catch {
        Write-ColorOutput "Error: Cannot connect to server" "Red"
        Write-Host "Make sure:"
        Write-Host "  1. Server is running"
        Write-Host "  2. SSH key is configured"
        Write-Host "  3. IP address is correct"
        exit 1
    }

    # Step 2: Check project directory
    Write-ColorOutput "[2/8] Checking project directory..." "Cyan"
    try {
        Invoke-SSH "[ -d $ProjectDir ]" | Out-Null
        Write-ColorOutput "✓ Project found" "Green"
    }
    catch {
        Write-ColorOutput "Error: Project directory not found: $ProjectDir" "Red"
        exit 1
    }

    # Step 3: Pull latest code
    Write-ColorOutput "[3/8] Pulling latest code from Git..." "Cyan"
    Invoke-SSH "cd $ProjectDir && git pull origin main"
    Write-ColorOutput "✓ Code updated" "Green"

    # Step 4: Backup
    Write-ColorOutput "[4/8] Creating backup..." "Cyan"
    $backupName = "antystyki-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Invoke-SSH "cd /var/www && sudo cp -r antystyki $backupName" | Out-Null
    Write-ColorOutput "✓ Backup created: $backupName" "Green"

    # Step 5: Stop containers
    Write-ColorOutput "[5/8] Stopping containers..." "Cyan"
    Invoke-SSH "cd $ProjectDir && docker-compose -f docker-compose.production.yml down" | Out-Null
    Write-ColorOutput "✓ Containers stopped" "Green"

    # Step 6: Build
    Write-ColorOutput "[6/8] Building new Docker image (this may take 5-10 minutes)..." "Cyan"
    Write-ColorOutput "Building... (please wait)" "Yellow"
    Invoke-SSH "cd $ProjectDir && docker-compose -f docker-compose.production.yml build --no-cache app"
    Write-ColorOutput "✓ Image built" "Green"

    # Step 7: Start containers
    Write-ColorOutput "[7/8] Starting containers..." "Cyan"
    Invoke-SSH "cd $ProjectDir && docker-compose -f docker-compose.production.yml up -d" | Out-Null
    Write-Host ""
    Write-ColorOutput "Waiting 30 seconds for services to start..." "Yellow"
    Start-Sleep -Seconds 30
    Write-ColorOutput "✓ Containers started" "Green"

    # Step 8: Health checks
    Write-ColorOutput "[8/8] Running health checks..." "Cyan"
    Write-Host ""

    # Check API health
    Write-Host "  Testing API health endpoint... " -NoNewline
    try {
        $health = Invoke-SSH "curl -sf http://localhost:5000/api/health"
        if ($health -match "healthy") {
            Write-ColorOutput "✓ PASS" "Green"
        }
        else {
            throw "Health check failed"
        }
    }
    catch {
        Write-ColorOutput "✗ FAIL" "Red"
        Write-ColorOutput "API health check failed. Check logs:" "Red"
        Write-Host "  ssh $User@$Server 'docker logs antystics-app'"
        exit 1
    }

    # Check robots.txt
    Write-Host "  Testing robots.txt... " -NoNewline
    try {
        $robots = Invoke-SSH "curl -sf http://localhost:5000/robots.txt | head -n 1"
        if ($robots -match "Antystyki") {
            Write-ColorOutput "✓ PASS" "Green"
        }
        else {
            Write-ColorOutput "⚠ NOT FOUND (may need rebuild)" "Yellow"
        }
    }
    catch {
        Write-ColorOutput "⚠ NOT FOUND (may need rebuild)" "Yellow"
    }

    # Check sitemap.xml
    Write-Host "  Testing sitemap.xml... " -NoNewline
    try {
        $sitemap = Invoke-SSH "curl -sf http://localhost:5000/sitemap.xml | head -n 1"
        if ($sitemap -match "xml") {
            Write-ColorOutput "✓ PASS" "Green"
        }
        else {
            Write-ColorOutput "⚠ NOT FOUND (may need rebuild)" "Yellow"
        }
    }
    catch {
        Write-ColorOutput "⚠ NOT FOUND (may need rebuild)" "Yellow"
    }

    # Check frontend
    Write-Host "  Testing frontend... " -NoNewline
    try {
        $frontend = Invoke-SSH "curl -sf http://localhost:5000/ | head -n 1"
        if ($frontend -match "doctype") {
            Write-ColorOutput "✓ PASS" "Green"
        }
        else {
            throw "Frontend check failed"
        }
    }
    catch {
        Write-ColorOutput "✗ FAIL" "Red"
        Write-ColorOutput "Frontend check failed" "Red"
        exit 1
    }

    # Container status
    Write-Host ""
    Write-ColorOutput "Container Status:" "Yellow"
    Invoke-SSH "cd $ProjectDir && docker-compose -f docker-compose.production.yml ps"

    Write-Host ""
    Write-ColorOutput "======================================" "Green"
    Write-ColorOutput "  Deployment Complete!" "Green"
    Write-ColorOutput "======================================" "Green"
    Write-Host ""
    Write-ColorOutput "Next steps:" "Yellow"
    Write-Host "1. Test in browser: https://antystyki.pl"
    Write-Host "2. Check SEO files:"
    Write-Host "   - https://antystyki.pl/robots.txt"
    Write-Host "   - https://antystyki.pl/sitemap.xml"
    Write-Host "3. Monitor logs:"
    Write-Host "   ssh $User@$Server 'docker logs -f antystics-app'"
    Write-Host ""
    Write-ColorOutput "If issues persist:" "Yellow"
    Write-Host "   ssh $User@$Server"
    Write-Host "   cd $ProjectDir"
    Write-Host "   docker-compose -f docker-compose.production.yml logs app"
    Write-Host ""
}
catch {
    Write-ColorOutput "Deployment failed: $_" "Red"
    exit 1
}

