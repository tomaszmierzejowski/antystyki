# 🔍 Debugging PostgreSQL Connection Issue

## Your Current Setup

**User Secrets Connection String:**
```
Host=localhost;Port=5432;Database=antystics;Username=postgres;Password=Quake112;Include Error Detail=true
```

**Fallback in Program.cs (if secrets fail):**
```csharp
Host=localhost;Database=antystics;Username=postgres;Password=postgres
```

## Step 1: Find Out What Password Your PostgreSQL Is Using

PostgreSQL might be configured with a different password. Here are ways to check:

### Method 1: Check Your PostgreSQL Installation

If you installed PostgreSQL yourself, recall what password you set during installation.

Common default passwords:
- `postgres` (most common)
- `admin`
- `password`
- `Quake112` (what you think it is)
- Empty password (no password)

### Method 2: Check PostgreSQL Data Directory

Your PostgreSQL config is likely in one of these locations:
- `C:\Program Files\PostgreSQL\<version>\data\pg_hba.conf`
- `C:\PostgreSQL\<version>\data\pg_hba.conf`

### Method 3: Try Connecting with Different Passwords

Try these commands one by one:

```powershell
# Test with 'postgres' password
$env:PGPASSWORD = "postgres"
psql -h localhost -U postgres -d antystics -c "SELECT 1;"

# Test with 'Quake112' password
$env:PGPASSWORD = "Quake112"
psql -h localhost -U postgres -d antystics -c "SELECT 1;"

# Test with empty password
$env:PGPASSWORD = ""
psql -h localhost -U postgres -d antystics -c "SELECT 1;"
```

If you don't have `psql`, try using pgAdmin or any PostgreSQL client.

## Step 2: Run Your App and See the Actual Error

```powershell
cd backend/Antystics.Api
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run
```

**Look for errors like:**
- `password authentication failed for user "postgres"`
- `no password supplied`
- `database "antystics" does not exist`
- `connection refused`

**Copy the exact error message** and we'll fix it.

## Step 3: Verify User Secrets Are Being Loaded

Add this temporary logging to see what's being used:

### Edit Program.cs (temporarily)

After line 47, add this:

```csharp
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Database=antystics;Username=postgres;Password=postgres";

// 🔍 TEMPORARY DEBUG: Print connection string (remove after debugging!)
Console.WriteLine($"🔍 DEBUG: Connection String = {connectionString}");
Console.WriteLine($"🔍 DEBUG: Environment = {builder.Environment.EnvironmentName}");
```

This will show you what connection string is actually being used.

## Step 4: Common Issues and Solutions

### Issue A: User Secrets Not Loading

**Symptom:** App uses fallback password `postgres` instead of your secret

**Solution:** Make sure you're in Development environment:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
cd backend/Antystics.Api
dotnet run
```

### Issue B: Wrong Password in PostgreSQL

**Symptom:** Error says "password authentication failed"

**Solution:** Find the correct password (Step 1), then update secrets:

```powershell
cd backend/Antystics.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=antystics;Username=postgres;Password=CORRECT_PASSWORD;Include Error Detail=true"
```

### Issue C: Database Doesn't Exist

**Symptom:** Error says `database "antystics" does not exist`

**Solution:** Create the database:

```powershell
# Connect to postgres database and create antystics
$env:PGPASSWORD = "YOUR_ACTUAL_PASSWORD"
psql -h localhost -U postgres -d postgres -c "CREATE DATABASE antystics;"
```

Or the app should create it automatically on first run with migrations.

### Issue D: PostgreSQL Using Different Port

**Symptom:** Connection refused or timeout

**Solution:** Check what port PostgreSQL is on:

```powershell
# Check listening ports
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -eq 5432}
```

If PostgreSQL is on a different port (like 5433), update your connection string.

## Step 5: Quick Fix - Reset PostgreSQL Password

If you can't remember the password, reset it:

### Using pgAdmin:
1. Open pgAdmin
2. Right-click on "postgres" user → Properties
3. Go to "Definition" tab
4. Set new password (e.g., "Quake112")
5. Save

### Using SQL (if you can log in as superuser):
```sql
ALTER USER postgres WITH PASSWORD 'Quake112';
```

Then update user secrets:
```powershell
cd backend/Antystics.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=antystics;Username=postgres;Password=Quake112;Include Error Detail=true"
```

## What To Do Right Now

1. **Run the app and get the error message:**
   ```powershell
   cd backend/Antystics.Api
   dotnet run
   ```

2. **Tell me the error message** - Copy it exactly

3. **OR try different passwords** manually:
   - Open pgAdmin or any PostgreSQL client
   - Try connecting with: `postgres`, `Quake112`, `admin`, empty

4. **Once you find the right password**, update user secrets:
   ```powershell
   cd backend/Antystics.Api
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=antystics;Username=postgres;Password=CORRECT_PASSWORD;Include Error Detail=true"
   ```

## Quick Commands Summary

```powershell
# See current secrets
cd backend/Antystics.Api
dotnet user-secrets list

# Update connection string with correct password
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=antystics;Username=postgres;Password=YOUR_CORRECT_PASSWORD;Include Error Detail=true"

# Run app
dotnet run

# Check PostgreSQL is running
Test-NetConnection -ComputerName localhost -Port 5432
```

## Still Stuck?

Run this command and send me the output:

```powershell
cd backend/Antystics.Api
dotnet run 2>&1 | Select-String -Pattern "password|connection|failed|error" -Context 2
```

This will show me the actual errors happening.

