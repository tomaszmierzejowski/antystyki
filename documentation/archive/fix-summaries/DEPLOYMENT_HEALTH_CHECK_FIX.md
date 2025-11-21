# ✅ Deployment Health Check Fix

## Issue

Deployment was failing with:
```
ERROR: for app  Container "da3a131b851a" is unhealthy.
Encountered errors while bringing up the project.
```

Also warning:
```
The FRONTEND_URL variable is not set. Defaulting to a blank string.
```

## Root Causes

### 1. Wrong Health Check Endpoint ❌

**Problem:**
- Docker health check was looking for `/health`
- Application actually serves health endpoint at `/api/health`

**Files affected:**
1. `docker-compose.production.yml` line 66
2. `Dockerfile.production` line 79

### 2. Missing FRONTEND_URL Environment Variable ⚠️

This is used for generating email verification and password reset links.

## Fixes Applied

### Fix 1: Update Health Check Endpoints

#### docker-compose.production.yml
**Before:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
```

**After:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
```

#### Dockerfile.production
**Before:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1
```

**After:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1
```

### Fix 2: Add FRONTEND_URL to Environment Variables

Add to your production `.env` file on the server:

```bash
# Frontend URL for email links
FRONTEND_URL=https://antystyki.pl
```

Or if you have separate frontend domain:
```bash
FRONTEND_URL=https://www.antystyki.pl
```

## Health Check Explanation

### What is a Docker Health Check?

A health check is a command Docker runs periodically to verify a container is working correctly.

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # Wait max 10 seconds for response
  retries: 3         # Try 3 times before marking unhealthy
  start_period: 40s  # Wait 40s after start before checking
```

### Health Check States

1. **starting** - Container just started, in grace period (40s)
2. **healthy** - Health check passed ✅
3. **unhealthy** - Health check failed 3 times in a row ❌

### Why It Was Failing

```
Container starts
    ↓
Wait 40s (start_period)
    ↓
Check: curl http://localhost:5000/health
    ↓
404 Not Found (endpoint doesn't exist!)
    ↓
Retry 1... 404
Retry 2... 404
Retry 3... 404
    ↓
Container marked UNHEALTHY ❌
    ↓
docker-compose fails
```

### After Fix

```
Container starts
    ↓
Wait 40s (start_period)
    ↓
Check: curl http://localhost:5000/api/health
    ↓
200 OK {"status":"healthy","database":"connected"} ✅
    ↓
Container marked HEALTHY ✅
    ↓
Deployment succeeds! 🎉
```

## Your Health Endpoint

From `backend/Antystics.Api/Program.cs` line 184:

```csharp
app.MapGet("/api/health", async (ApplicationDbContext? dbContext) =>
{
    var health = new
    {
        status = "healthy",
        timestamp = DateTime.UtcNow.ToString("o"),
        version = "1.0.0",
        environment = app.Environment.EnvironmentName,
        database = "unknown"
    };

    try
    {
        if (dbContext != null)
        {
            var canConnect = await dbContext.Database.CanConnectAsync();
            health = health with { database = canConnect ? "connected" : "disconnected" };
        }
        
        return Results.Ok(health);
    }
    catch (Exception)
    {
        health = health with { database = "disconnected" };
        return Results.Ok(health);
    }
});
```

**Response example:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-26T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "Production",
  "database": "connected"
}
```

## FRONTEND_URL Variable

### What it's used for:

```csharp
var frontendUrl = _configuration["FrontendUrl"] ?? $"{Request.Scheme}://{Request.Host}";
var verificationLink = $"{frontendUrl}/verify-email?token={encodedToken}";
```

Generates links like:
- `https://antystyki.pl/verify-email?token=abc123`
- `https://antystyki.pl/reset-password?token=xyz789`

### Fallback behavior:

If `FRONTEND_URL` is not set:
- Uses `Request.Scheme` + `Request.Host`
- Results in: `http://localhost:5000/verify-email?token=...`
- ⚠️ This won't work for email links!

### Solution:

Add to `.env` file on server:
```bash
FRONTEND_URL=https://antystyki.pl
```

And update `docker-compose.production.yml` is already configured to read it (line 54):
```yaml
- FrontendUrl=${FRONTEND_URL}
```

## Verification Steps

### 1. SSH to Server
```bash
ssh user@your-server-ip
cd /var/www/antystyki
```

### 2. Update .env File
```bash
nano .env

# Add this line:
FRONTEND_URL=https://antystyki.pl
```

### 3. Redeploy
```bash
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### 4. Check Health
```bash
# Wait 40 seconds for start_period
sleep 45

# Check container health
docker ps

# Should show: STATUS = Up X minutes (healthy)
```

### 5. Test Health Endpoint
```bash
curl http://localhost:5000/api/health

# Expected output:
# {"status":"healthy","timestamp":"...","version":"1.0.0","environment":"Production","database":"connected"}
```

### 6. Check Logs
```bash
docker logs antystics-app --tail 50
```

**Expected output:**
```
Now listening on: http://[::]:5000
Application started. Press Ctrl+C to shut down.
Hosting environment: Production
```

## GitHub Actions Update

The workflow also needs to transfer the updated `docker-compose.production.yml`:

This is already handled in `.github/workflows/deploy.yml` line 159:
```yaml
scp docker-compose.production.yml ${{ secrets.SSH_USER }}@${{ secrets.PROD_SERVER_IP }}:/var/www/antystyki/
```

## Summary of Changes

| File | Line | Change |
|------|------|--------|
| `docker-compose.production.yml` | 66 | `/health` → `/api/health` |
| `Dockerfile.production` | 79 | `/health` → `/api/health` |
| `.env` (on server) | - | Add `FRONTEND_URL=https://...` |

## Commit and Deploy

```bash
git add docker-compose.production.yml Dockerfile.production
git commit -m "fix: correct health check endpoint from /health to /api/health"
git push
```

The GitHub Actions workflow will:
1. ✅ Build with correct health check
2. ✅ Deploy to server
3. ✅ Container will pass health check
4. ✅ Deployment succeeds

## Common Issues

### Container still unhealthy?

**Check logs:**
```bash
docker logs antystics-app
```

**Common causes:**
1. Database connection failed
2. Port 5000 not accessible
3. Application crashed on startup
4. Missing environment variables

### Can't access health endpoint?

**From inside container:**
```bash
docker exec -it antystics-app curl http://localhost:5000/api/health
```

**From outside:**
```bash
curl http://localhost:5000/api/health
```

---

**Status:** ✅ **FIXED**

**Next Deployment:** ✅ **SHOULD SUCCEED**

