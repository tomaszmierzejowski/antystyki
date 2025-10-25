# Antystyki Production Health Check Script
# Version: 1.0
# Date: October 15, 2025
#
# This script performs comprehensive health checks on production deployment
# Usage: .\health-check.ps1 -Server YOUR_SERVER_IP

param(
    [string]$Server = "",
    [switch]$Verbose = $false
)

# Configuration
$endpoints = @(
    @{Name="Frontend"; URL="https://$Server"; ExpectedStatus=200},
    @{Name="API Health"; URL="https://api.$Server/api/health"; ExpectedStatus=200},
    @{Name="Backend Swagger"; URL="https://api.$Server/swagger"; ExpectedStatus=200}
)

$securityHeaders = @(
    "X-Frame-Options",
    "X-Content-Type-Options",
    "X-XSS-Protection",
    "Referrer-Policy"
)

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║         Antystyki Health Check v1.0                      ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

if ([string]::IsNullOrEmpty($Server)) {
    $Server = Read-Host "Enter production server IP or hostname"
}

Write-Host "Checking server: $Server" -ForegroundColor Blue
Write-Host "Time: $(Get-Date)" -ForegroundColor Blue
Write-Host ""

# Test 1: Endpoint Availability
Write-Host "Test 1: Endpoint Availability" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$allEndpointsOk = $true

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.URL -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq $endpoint.ExpectedStatus) {
            Write-Host "  ✓ $($endpoint.Name)" -ForegroundColor Green -NoNewline
            Write-Host " → HTTP $($response.StatusCode)" -ForegroundColor DarkGray
        } else {
            Write-Host "  ✗ $($endpoint.Name)" -ForegroundColor Red -NoNewline
            Write-Host " → HTTP $($response.StatusCode) (expected $($endpoint.ExpectedStatus))" -ForegroundColor Yellow
            $allEndpointsOk = $false
        }
    } catch {
        Write-Host "  ✗ $($endpoint.Name)" -ForegroundColor Red -NoNewline
        Write-Host " → $($_.Exception.Message)" -ForegroundColor Yellow
        $allEndpointsOk = $false
    }
}

Write-Host ""

# Test 2: Security Headers
Write-Host "Test 2: Security Headers" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$headersOk = $true

try {
    $response = Invoke-WebRequest -Uri "https://api.$Server/api/health" -UseBasicParsing -TimeoutSec 10
    
    foreach ($header in $securityHeaders) {
        if ($response.Headers.ContainsKey($header)) {
            Write-Host "  ✓ $header" -ForegroundColor Green -NoNewline
            if ($Verbose) {
                Write-Host " → $($response.Headers[$header])" -ForegroundColor DarkGray
            } else {
                Write-Host ""
            }
        } else {
            Write-Host "  ✗ $header" -ForegroundColor Red -NoNewline
            Write-Host " → Missing" -ForegroundColor Yellow
            $headersOk = $false
        }
    }
    
    # Check HSTS (should be present in production)
    if ($response.Headers.ContainsKey("Strict-Transport-Security")) {
        Write-Host "  ✓ Strict-Transport-Security (HSTS)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Strict-Transport-Security (HSTS)" -ForegroundColor Yellow -NoNewline
        Write-Host " → Not set (may be OK if behind reverse proxy)" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "  ✗ Could not check headers: $($_.Exception.Message)" -ForegroundColor Red
    $headersOk = $false
}

Write-Host ""

# Test 3: SSL Certificate
Write-Host "Test 3: SSL Certificate" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$sslOk = $true

try {
    $uri = [System.Uri]"https://$Server"
    $request = [System.Net.WebRequest]::Create($uri)
    $request.Timeout = 10000
    $response = $request.GetResponse()
    $cert = $request.ServicePoint.Certificate
    
    if ($cert) {
        $certExpiry = [DateTime]::Parse($cert.GetExpirationDateString())
        $daysUntilExpiry = ($certExpiry - (Get-Date)).Days
        
        Write-Host "  ✓ SSL Certificate Valid" -ForegroundColor Green
        Write-Host "    Issuer: $($cert.Issuer)" -ForegroundColor DarkGray
        Write-Host "    Expires: $certExpiry ($daysUntilExpiry days)" -ForegroundColor DarkGray
        
        if ($daysUntilExpiry -lt 30) {
            Write-Host "    ⚠ Certificate expires soon!" -ForegroundColor Yellow
        }
    }
    
    $response.Close()
} catch {
    Write-Host "  ✗ SSL Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $sslOk = $false
}

Write-Host ""

# Test 4: Docker Container Status (if SSH access available)
Write-Host "Test 4: Docker Container Status (requires SSH)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

if (Get-Command ssh -ErrorAction SilentlyContinue) {
    try {
        $containerStatus = ssh "antystyki@$Server" "cd /var/www/antystyki && docker-compose -f docker-compose.production.yml ps 2>&1"
        
        if ($containerStatus -match "Up") {
            Write-Host "  ✓ Containers are running" -ForegroundColor Green
            if ($Verbose) {
                Write-Host $containerStatus -ForegroundColor DarkGray
            }
        } else {
            Write-Host "  ✗ Containers may not be running" -ForegroundColor Red
            Write-Host $containerStatus -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠ Could not check containers (SSH may not be configured)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ SSH not available (skipping container check)" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Database Connection (via API)
Write-Host "Test 5: Database Connection (via API)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$dbOk = $true

try {
    # Try to fetch categories (should work even without auth)
    $response = Invoke-WebRequest -Uri "https://api.$Server/api/categories" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Database connection OK" -ForegroundColor Green
        $categories = $response.Content | ConvertFrom-Json
        Write-Host "    Found $($categories.Count) categories" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "  ✗ Database connection failed: $($_.Exception.Message)" -ForegroundColor Red
    $dbOk = $false
}

Write-Host ""

# Summary
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║                  Health Check Summary                     ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

$overallStatus = $allEndpointsOk -and $headersOk -and $sslOk -and $dbOk

if ($overallStatus) {
    Write-Host "Overall Status: " -NoNewline
    Write-Host "HEALTHY ✓" -ForegroundColor Green
    Write-Host ""
    Write-Host "All critical checks passed!" -ForegroundColor Green
    Write-Host "Your production deployment is ready for users." -ForegroundColor Green
} else {
    Write-Host "Overall Status: " -NoNewline
    Write-Host "ISSUES DETECTED ⚠" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Some checks failed. Review the output above." -ForegroundColor Yellow
    Write-Host "This may be normal if deployment is still in progress." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Recommendations:" -ForegroundColor Blue
Write-Host "  • Run this check after every deployment" -ForegroundColor DarkGray
Write-Host "  • Set up UptimeRobot for 24/7 monitoring" -ForegroundColor DarkGray
Write-Host "  • Check logs if any test fails: ssh antystyki@$Server 'docker-compose -f /var/www/antystyki/docker-compose.production.yml logs'" -ForegroundColor DarkGray
Write-Host ""

# Exit with appropriate code
if ($overallStatus) {
    exit 0
} else {
    exit 1
}

