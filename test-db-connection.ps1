# Test PostgreSQL Connection
Write-Host "Testing PostgreSQL Connections..." -ForegroundColor Cyan

$passwords = @("Quake112", "postgres", "", "admin", "password")
$host = "localhost"
$port = "5432"
$database = "antystics"
$username = "postgres"

foreach ($pwd in $passwords) {
    Write-Host "`nTrying password: '$pwd'" -ForegroundColor Yellow
    
    $env:PGPASSWORD = $pwd
    
    try {
        # Try to connect using psql if available
        $result = psql -h $host -p $port -U $username -d postgres -c "SELECT 1;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SUCCESS! PostgreSQL password is: '$pwd'" -ForegroundColor Green
            Write-Host "`nYou need to update your user secrets with this password:" -ForegroundColor Yellow
            Write-Host "cd backend/Antystics.Api" -ForegroundColor White
            Write-Host "dotnet user-secrets set `"ConnectionStrings:DefaultConnection`" `"Host=localhost;Port=5432;Database=antystics;Username=postgres;Password=$pwd;Include Error Detail=true`"" -ForegroundColor White
            break
        }
    }
    catch {
        Write-Host "❌ Failed" -ForegroundColor Red
    }
}

Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

