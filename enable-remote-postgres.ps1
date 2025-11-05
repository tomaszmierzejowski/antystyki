# PowerShell script to enable remote PostgreSQL access
# Run this script on your server to enable remote connections

Write-Host "🔧 Enabling Remote PostgreSQL Access..." -ForegroundColor Cyan

# Check if docker-compose.production.yml exists
if (-not (Test-Path "docker-compose.production.yml")) {
    Write-Host "❌ Error: docker-compose.production.yml not found!" -ForegroundColor Red
    Write-Host "   Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📝 Step 1: Updating docker-compose.production.yml..." -ForegroundColor Yellow

# Read the docker-compose file
$content = Get-Content "docker-compose.production.yml" -Raw

# Replace localhost-only binding with public binding
$content = $content -replace '127\.0\.0\.1:5432:5432', '5432:5432'

# Uncomment PostgreSQL config volume mounts
$content = $content -replace '# - \./database/postgres-config/postgresql\.conf', '- ./database/postgres-config/postgresql.conf'
$content = $content -replace '# - \./database/postgres-config/pg_hba\.conf', '- ./database/postgres-config/pg_hba.conf'

# Uncomment command override
$content = $content -replace '# command: >', 'command: >'
$content = $content -replace '#   postgres', '  postgres'
$content = $content -replace '#   -c config_file=/etc/postgresql/postgresql\.conf', '  -c config_file=/etc/postgresql/postgresql.conf'
$content = $content -replace '#   -c hba_file=/etc/postgresql/pg_hba\.conf', '  -c hba_file=/etc/postgresql/pg_hba.conf'

# Write back to file
Set-Content "docker-compose.production.yml" -Value $content -NoNewline

Write-Host "✅ Updated docker-compose.production.yml" -ForegroundColor Green

Write-Host "`n📝 Step 2: Checking PostgreSQL config files..." -ForegroundColor Yellow

if (-not (Test-Path "database/postgres-config/postgresql.conf")) {
    Write-Host "❌ Error: database/postgres-config/postgresql.conf not found!" -ForegroundColor Red
    Write-Host "   Please ensure the PostgreSQL config files are in place." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "database/postgres-config/pg_hba.conf")) {
    Write-Host "❌ Error: database/postgres-config/pg_hba.conf not found!" -ForegroundColor Red
    Write-Host "   Please ensure the PostgreSQL config files are in place." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL config files found" -ForegroundColor Green

Write-Host "`n⚠️  SECURITY WARNING:" -ForegroundColor Yellow
Write-Host "   PostgreSQL will now accept connections from ANY IP address!" -ForegroundColor Red
Write-Host "   Make sure you:" -ForegroundColor Yellow
Write-Host "   1. Use a STRONG password for POSTGRES_PASSWORD" -ForegroundColor Yellow
Write-Host "   2. Configure firewall to restrict access (recommended)" -ForegroundColor Yellow
Write-Host "   3. Consider restricting IPs in pg_hba.conf" -ForegroundColor Yellow

$confirm = Read-Host "`nContinue with enabling remote access? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Aborted. No changes will be applied." -ForegroundColor Red
    exit 0
}

Write-Host "`n🔄 Step 3: Restarting Docker containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

Write-Host "`n✅ Remote PostgreSQL access enabled!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Configure firewall: sudo ufw allow from YOUR_IP to any port 5432" -ForegroundColor White
Write-Host "   2. Test connection from pgAdmin using your server IP" -ForegroundColor White
Write-Host "   3. Review database/postgres-config/pg_hba.conf for IP restrictions" -ForegroundColor White

Write-Host "`n📖 See POSTGRESQL_REMOTE_ACCESS.md for detailed instructions." -ForegroundColor Cyan

