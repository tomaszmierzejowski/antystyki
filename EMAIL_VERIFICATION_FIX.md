# Email Verification Link Fix

**Date**: October 26, 2025  
**Issue**: Malformed email verification links causing Chrome redirect warnings  
**Status**: ✅ Diagnosed - Configuration Issue

---

## 🐛 Problem Description

### User Report
When clicking email verification link, Chrome shows warning:
```
Ostrzeżenie o przekierowaniu
Poprzednia strona próbuje Cię przekierować do nieprawidłowego adresu URL 
(http:///verify-email?token=2JaUsGeR%2B...)
```

### Root Cause
The verification link is malformed: `http:///verify-email?token=...`

Notice the **triple slash** (`http:///`) - the domain is missing entirely.

---

## 🔍 Technical Analysis

### How Email Links Are Generated

**Location**: `backend/Antystics.Api/Controllers/AuthController.cs:132`

```csharp
var frontendUrl = _configuration["FrontendUrl"] ?? $"{Request.Scheme}://{Request.Host}";
var encodedToken = Uri.EscapeDataString(verificationToken);
var verificationLink = $"{frontendUrl}/verify-email?token={encodedToken}";
```

### Configuration Flow

1. **Docker Compose** (`docker-compose.production.yml:54`):
   ```yaml
   - FrontendUrl=${FRONTEND_URL}
   ```
   Maps `.env` file's `FRONTEND_URL` → container's `FrontendUrl`

2. **ASP.NET Core Configuration**:
   - Reads from `appsettings.json` (default: `http://localhost:5173`)
   - Overridden by environment variable `FrontendUrl` in container
   - Accessed via `_configuration["FrontendUrl"]`

3. **Fallback Logic**:
   - If `FrontendUrl` is null/empty → uses `Request.Scheme` + `Request.Host`
   - If Request context is malformed → produces `http:///`

### Why It's Failing

The `.env` file on the production server likely:
- ❌ Doesn't have `FRONTEND_URL` set at all
- ❌ Has `FRONTEND_URL=` (empty value)
- ❌ Has malformed URL (e.g., just scheme without domain)

---

## ✅ Solution

### Step 1: Verify .env File Exists

**On production server**:
```bash
ssh your-user@antystyki.pl
cd /path/to/antystics
ls -la .env
```

If `.env` doesn't exist:
```bash
cp PRODUCTION.env.example .env
```

### Step 2: Set FRONTEND_URL

**Edit .env file**:
```bash
nano .env
```

**Ensure this line exists and is correct**:
```bash
FRONTEND_URL=https://antystyki.pl
```

**Important**:
- ✅ Use `https://` (not `http://`)
- ✅ No trailing slash
- ✅ Use production domain (not localhost)
- ❌ Don't leave empty: `FRONTEND_URL=`
- ❌ Don't use placeholders: `FRONTEND_URL=your-domain-here`

### Step 3: Verify Configuration

**Run verification script**:

**Windows (PowerShell)**:
```powershell
.\verify-env.ps1
```

**Linux/Mac**:
```bash
chmod +x verify-env.sh
./verify-env.sh
```

**Expected output**:
```
✅ .env file found
✅ FRONTEND_URL - https://antystyki.pl
✅ All critical variables are properly configured!
🚀 Ready to deploy!
```

### Step 4: Restart Application

**Option A: Using Docker Compose**:
```bash
cd /path/to/antystics
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

**Option B: Using deployment script**:
```bash
./redeploy.sh
```

The restart is **necessary** because environment variables are only loaded at container startup.

---

## 🧪 Testing the Fix

### 1. Register New User

```bash
# Using curl
curl -X POST https://antystyki.pl/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!"
  }'
```

Or use the frontend registration form.

### 2. Check Email

Open the verification email and inspect the link:

**❌ Before Fix** (broken):
```
http:///verify-email?token=abc123...
```

**✅ After Fix** (correct):
```
https://antystyki.pl/verify-email?token=abc123...
```

### 3. Click Link

Should navigate to `https://antystyki.pl/verify-email?token=...` without warnings.

### 4. Verify Database

Check that email was marked as verified:
```bash
docker exec -it antystics-db psql -U postgres -d antystics
```

```sql
SELECT "UserName", "Email", "EmailConfirmed" 
FROM "AspNetUsers" 
WHERE "Email" = 'test@example.com';
```

Should show `EmailConfirmed = true`.

---

## 🔍 Debugging

### Check Environment Variable in Container

```bash
# List running containers
docker ps

# Check environment variables in app container
docker exec antystics-app env | grep FRONTEND

# Expected output:
# FrontendUrl=https://antystyki.pl
```

If `FrontendUrl` is not shown or is empty:
1. Check `.env` file has `FRONTEND_URL=https://antystyki.pl`
2. Restart container
3. Check again

### Check Application Logs

```bash
# View real-time logs
docker-compose -f docker-compose.production.yml logs -f app

# Search for email-related logs
docker-compose logs app | grep -i "verification\|email"
```

### Manual Configuration Check

**Check what the app is reading**:
```bash
# Get a shell in the container
docker exec -it antystics-app sh

# Check environment
echo $FrontendUrl

# Check appsettings.json (default value)
cat appsettings.json | grep FrontendUrl
```

---

## 📋 Complete .env File Template

Here's what your `.env` should look like for production:

```bash
# =============================================================================
# CRITICAL: Frontend URL Configuration
# =============================================================================
FRONTEND_URL=https://antystyki.pl

# =============================================================================
# DATABASE
# =============================================================================
POSTGRES_DB=antystics
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<your-secure-32-char-password>

# =============================================================================
# JWT AUTHENTICATION
# =============================================================================
JWT_SECRET=<your-secure-64-char-secret>
JWT_ISSUER=Antystics
JWT_AUDIENCE=AntysticsUsers

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<your-gmail-app-password>
EMAIL_FROM_ADDRESS=noreply@antystyki.pl
EMAIL_FROM_NAME=Antystyki

# =============================================================================
# CORS
# =============================================================================
CORS_ALLOWED_ORIGINS=https://antystyki.pl,https://www.antystyki.pl

# =============================================================================
# APPLICATION
# =============================================================================
ASPNETCORE_ENVIRONMENT=Production
```

---

## 🔐 Security Notes

### Why FRONTEND_URL Matters

This variable is used for:
1. ✉️ **Email verification links** - Most critical
2. 🔑 **Password reset links** - Security sensitive
3. 📧 **Welcome emails** - May contain links back to site

### Security Implications

**If FRONTEND_URL is wrong**:
- ❌ Users can't verify emails → Can't log in
- ❌ Password resets don't work
- ⚠️ Could potentially be exploited for phishing if attacker controls the domain

**Best Practices**:
- ✅ Always use HTTPS in production
- ✅ Match your actual domain exactly
- ✅ Don't use IP addresses
- ✅ Keep .env file secure (never commit to git)
- ✅ Verify after any domain changes

---

## 📚 Related Files

### Configuration Files
- `.env` - Production environment variables **(YOU MUST CREATE THIS)**
- `PRODUCTION.env.example` - Template with documentation
- `backend/Antystics.Api/appsettings.json` - Default config (development)
- `docker-compose.production.yml` - Environment variable mapping

### Code Files
- `backend/Antystics.Api/Controllers/AuthController.cs` - Link generation
- `backend/Antystics.Infrastructure/Services/EmailService.cs` - Email sending

### Scripts
- `verify-env.ps1` / `verify-env.sh` - Environment verification
- `redeploy.ps1` / `redeploy.sh` - Deployment scripts

---

## ✅ Verification Checklist

Before considering this issue resolved:

- [ ] `.env` file exists on production server
- [ ] `FRONTEND_URL=https://antystyki.pl` is set in `.env`
- [ ] No trailing slash in FRONTEND_URL
- [ ] Using HTTPS (not HTTP)
- [ ] Run `verify-env.sh` successfully
- [ ] Restarted application containers
- [ ] Verified environment variable in container: `docker exec antystics-app env | grep Frontend`
- [ ] Registered test user
- [ ] Received email with correct link format
- [ ] Link starts with `https://antystyki.pl/verify-email`
- [ ] No Chrome redirect warnings
- [ ] Successfully verified email
- [ ] User can log in after verification

---

## 🔄 Other Affected Features

The same `FRONTEND_URL` is used in:

1. **Password Reset** (`AuthController.cs:257`):
   ```csharp
   var resetLink = $"{frontendUrl}/reset-password?token={encodedToken}";
   ```

2. **Resend Verification** (`AuthController.cs:350`):
   ```csharp
   var verificationLink = $"{frontendUrl}/verify-email?token={encodedToken}";
   ```

**After fixing FRONTEND_URL, test these too**:
- [ ] Password reset emails have correct links
- [ ] Resend verification emails have correct links

---

## 🚀 Quick Reference

### Check if fixed:
```bash
docker exec antystics-app env | grep FrontendUrl
# Should show: FrontendUrl=https://antystyki.pl
```

### Re-deploy after changing .env:
```bash
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### Test email link:
Register at https://antystyki.pl/register and check the email link format.

---

**Status**: Waiting for production .env configuration  
**Next Steps**: 
1. Set `FRONTEND_URL` in production `.env`
2. Restart containers
3. Test registration → email → verification flow

