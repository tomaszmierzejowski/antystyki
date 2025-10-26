# Production Issues - Fix Summary & Action Plan

**Date**: October 26, 2025  
**Status**: ✅ Fixes Implemented & Diagnosed

---

## 📋 Issues Reported

### Issue #1: Content Security Policy (CSP) Violations ✅ FIXED
```
Refused to load the stylesheet 'https://fonts.googleapis.com/...'
Refused to connect to '<URL>' because it violates CSP directive
Error fetching categories: ce
Error fetching antistics: ce
```

### Issue #2: Malformed Email Verification Links 🔧 NEEDS CONFIGURATION
```
Ostrzeżenie o przekierowaniu
http:///verify-email?token=...
```

---

## 🎯 Solution Summary

### ✅ Issue #1: CSP - FIXED (Ready to Deploy)

**What was fixed**:
1. Updated Content Security Policy to allow Google Fonts
2. Fixed API calls to use relative URLs in production
3. Added explicit CSP directives for fonts and API connections

**Files changed**:
- ✅ `backend/Antystics.Api/Program.cs` - Updated CSP headers
- ✅ `frontend/src/config/api.ts` - Fixed API URL configuration
- ✅ `PRODUCTION.env.example` - Updated documentation
- ✅ `CSP_FIX_DEPLOYMENT.md` - Created deployment guide
- ✅ `CHANGELOG.md` - Documented changes

**Action required**: Deploy the changes (see instructions below)

---

### 🔧 Issue #2: Email Links - NEEDS CONFIGURATION

**Root cause**: 
Production `.env` file is missing or has incorrect `FRONTEND_URL` setting.

**What's needed**:
Set `FRONTEND_URL=https://antystyki.pl` in production `.env` file.

**Files created**:
- ✅ `EMAIL_VERIFICATION_FIX.md` - Complete troubleshooting guide
- ✅ `verify-env.ps1` / `verify-env.sh` - Environment verification scripts

**Action required**: Configure production environment (see instructions below)

---

## 🚀 Deployment Instructions

### Step 1: Commit and Push Code Changes (CSP Fix)

**On your local machine (Windows PowerShell)**:

```powershell
# 1. Add all changes
git add .

# 2. Commit with descriptive message
git commit -m "fix: Update CSP for Google Fonts, fix API URLs, add email config verification"

# 3. Push to production
git push origin main
```

---

### Step 2: Configure Production Environment (Email Fix)

**SSH into your production server**:

```bash
ssh your-user@antystyki.pl
cd /path/to/antystics
```

**Check if .env file exists**:

```bash
ls -la .env
```

**If .env doesn't exist, create it**:
```bash
cp PRODUCTION.env.example .env
```

**Edit .env file**:
```bash
nano .env
```

**Ensure these critical variables are set**:

```bash
# Frontend URL - CRITICAL for email links
FRONTEND_URL=https://antystyki.pl

# Database
POSTGRES_PASSWORD=<your-secure-password>

# JWT
JWT_SECRET=<your-jwt-secret>

# Email (if using email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<your-gmail-app-password>
EMAIL_FROM_ADDRESS=noreply@antystyki.pl

# CORS
CORS_ALLOWED_ORIGINS=https://antystyki.pl,https://www.antystyki.pl
```

**Save and exit** (Ctrl+X, Y, Enter in nano)

---

### Step 3: Verify Environment Configuration

**Run the verification script**:

```bash
# Make script executable
chmod +x verify-env.sh

# Run verification
./verify-env.sh
```

**Expected output**:
```
✅ .env file found
✅ FRONTEND_URL - https://antystyki.pl
✅ POSTGRES_PASSWORD - Set (hidden)
✅ JWT_SECRET - Set (hidden)
...
✅ All critical variables are properly configured!
🚀 Ready to deploy!
```

**If you see errors** ❌:
- Edit `.env` file again: `nano .env`
- Fix the values marked with ❌ or ⚠️
- Run verification again: `./verify-env.sh`

---

### Step 4: Pull Latest Code

```bash
# Pull latest changes from Git
git pull origin main
```

---

### Step 5: Rebuild and Restart Containers

```bash
# Stop containers
docker-compose -f docker-compose.production.yml down

# Rebuild (includes new CSP fix)
docker-compose -f docker-compose.production.yml build --no-cache

# Start containers with new environment
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

**All services should show "Up" status**.

---

### Step 6: Verify Environment in Container

```bash
# Check that FRONTEND_URL is set in container
docker exec antystics-app env | grep Frontend
```

**Expected output**:
```
FrontendUrl=https://antystyki.pl
```

If empty or wrong, check your `.env` file and restart containers.

---

## ✅ Verification & Testing

### Test #1: CSP and API Calls

**Open browser**:
1. Navigate to https://antystyki.pl
2. Press **F12** (open DevTools)
3. Go to **Console** tab

**Expected results**:
- ✅ **NO CSP errors** about Google Fonts
- ✅ **NO CSP errors** about connect-src
- ✅ **NO errors** about fetching categories or antistics
- ✅ Homepage displays antistics correctly
- ✅ Fonts look correct (Inter font family)

**Check Network tab**:
- ✅ `/api/categories` → 200 OK
- ✅ `/api/antistics` → 200 OK
- ✅ `fonts.googleapis.com` requests succeed

---

### Test #2: Email Verification Links

**Register a test account**:
1. Go to https://antystyki.pl/register
2. Register with a real email address you can access
3. Check your email

**Expected results**:
- ✅ Email received
- ✅ Verification link looks like: `https://antystyki.pl/verify-email?token=...`
- ✅ **NOT** like: `http:///verify-email?token=...`
- ✅ Clicking link navigates to site (no Chrome warning)
- ✅ Email verified successfully
- ✅ Can log in

---

### Test #3: Backend Health Check

```bash
# From production server
curl https://antystyki.pl/health

# Expected output:
# {"status":"healthy","timestamp":"...","version":"1.0.0","environment":"Production","database":"connected"}
```

---

### Test #4: Container Logs

```bash
# Check for any errors
docker-compose -f docker-compose.production.yml logs --tail=100

# Should see no errors, healthy startup messages
```

---

## 🔍 Troubleshooting

### Problem: Still seeing CSP errors

**Solution**:
```bash
# 1. Hard refresh browser (clear cache)
Ctrl + Shift + R  (or Cmd + Shift + R on Mac)

# 2. Verify backend restarted
docker-compose ps
# All services should show "Up" with recent timestamps

# 3. Check CSP header in browser
# DevTools → Network → (any request) → Headers → Response Headers
# Look for "Content-Security-Policy" header
# Should include: "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
```

---

### Problem: Email links still malformed

**Solution**:
```bash
# 1. Verify .env file
cat .env | grep FRONTEND_URL
# Should show: FRONTEND_URL=https://antystyki.pl

# 2. Verify environment in container
docker exec antystics-app env | grep Frontend
# Should show: FrontendUrl=https://antystyki.pl

# 3. If wrong, restart containers
docker-compose -f docker-compose.production.yml restart app

# 4. Check again
docker exec antystics-app env | grep Frontend
```

---

### Problem: API calls still failing

**Solution**:
```bash
# 1. Check nginx logs
sudo tail -f /var/log/nginx/antystyki_error.log

# 2. Check backend logs
docker-compose logs backend

# 3. Test API directly
curl http://localhost:5000/api/health
curl https://antystyki.pl/api/health

# 4. Check nginx is proxying
curl -I https://antystyki.pl/api/health
# Should show HTTP/2 200 OK
```

---

## 📊 Quick Status Check Commands

### One-Line Health Checks

```bash
# Check all containers running
docker-compose ps

# Check environment
docker exec antystics-app env | grep -E "Frontend|CORS|SMTP"

# Check API health
curl -s https://antystyki.pl/health | jq

# Check recent logs
docker-compose logs --tail=20 app
```

---

## 📚 Documentation Reference

### Deployment Guides
- **CSP_FIX_DEPLOYMENT.md** - Complete CSP fix deployment guide
- **EMAIL_VERIFICATION_FIX.md** - Email configuration troubleshooting
- **DEPLOYMENT.md** - Full deployment documentation
- **PRODUCTION_SETUP.md** - Production setup guide

### Configuration
- **PRODUCTION.env.example** - Environment variable template
- **docker-compose.production.yml** - Production container config

### Scripts
- **verify-env.ps1** / **verify-env.sh** - Environment verification
- **redeploy.ps1** / **redeploy.sh** - Quick redeployment
- **health-check.ps1** - Health check script

---

## ✅ Final Checklist

Before marking this as complete:

### CSP Fix
- [ ] Code changes committed and pushed to Git
- [ ] Production server pulled latest code
- [ ] Containers rebuilt and restarted
- [ ] No CSP errors in browser console
- [ ] API calls working (categories, antistics load)
- [ ] Google Fonts loading correctly
- [ ] Inter font displays properly

### Email Fix
- [ ] `.env` file exists on production server
- [ ] `FRONTEND_URL=https://antystyki.pl` set correctly
- [ ] No trailing slash in URL
- [ ] Using HTTPS (not HTTP)
- [ ] Ran `verify-env.sh` successfully
- [ ] Containers restarted after .env changes
- [ ] Environment variable visible in container
- [ ] Test registration sent email
- [ ] Email link has correct format (https://antystyki.pl/...)
- [ ] No Chrome redirect warning
- [ ] Email verification works

### General Health
- [ ] All containers running (docker-compose ps)
- [ ] Health endpoint returns healthy
- [ ] No errors in application logs
- [ ] Website loads correctly
- [ ] Can create account
- [ ] Can verify email
- [ ] Can log in

---

## 📞 Support

If issues persist after following this guide:

1. **Check logs**: `docker-compose logs --tail=200`
2. **Review documentation**: See references above
3. **Environment verification**: Run `verify-env.sh`
4. **Check configuration**: Compare with `PRODUCTION.env.example`

---

**Estimated Time**: 15-30 minutes  
**Difficulty**: Easy to Medium  
**Risk Level**: Low (fixes production bugs)  
**Rollback**: `git revert` if needed

---

**Next Steps**: Follow Step 1 through Step 6 above, then run verification tests.

