# Check what error the app is getting
Write-Host "Running the application to see database errors..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop after you see the error`n" -ForegroundColor Yellow

cd backend\Antystics.Api
$env:ASPNETCORE_ENVIRONMENT = "Development"

# Run and capture output
dotnet run 2>&1 | ForEach-Object {
    $line = $_.ToString()
    
    # Highlight errors in red
    if ($line -match "fail|error|exception|password" -and $line -notmatch "0 Error") {
        Write-Host $line -ForegroundColor Red
    }
    # Highlight warnings in yellow
    elseif ($line -match "warn" -and $line -notmatch "0 Warning") {
        Write-Host $line -ForegroundColor Yellow
    }
    # Show success in green
    elseif ($line -match "Now listening|Application started|started successfully") {
        Write-Host $line -ForegroundColor Green
    }
    # Normal output
    else {
        Write-Host $line
    }
}

