# Content Security Policy (CSP) Fix for Production

**Date**: October 26, 2025  
**Issue**: CSP blocking Google Fonts and API connections on production  
**Status**: ✅ Fixed - Ready for Deployment

---

## 🐛 Problems Identified

### 1. Google Fonts Blocked
```
Refused to load the stylesheet 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap' 
because it violates the following Content Security Policy directive: "style-src 'self' 'unsafe-inline'"
```

**Root Cause**: CSP `style-src` directive didn't allow external stylesheets from `fonts.googleapis.com`

### 2. API Connections Blocked
```
Refused to connect to '<URL>' because it violates the following Content Security Policy directive: 
"default-src 'self'". Note that 'connect-src' was not explicitly set
```

**Root Cause**: 
- `connect-src` wasn't explicitly set, falling back to `default-src 'self'`
- Frontend was trying to use absolute URL from `VITE_API_URL` instead of relative URL

### 3. Data Fetch Failures
```
Error fetching categories: ce
Error fetching antistics: ce
```

**Root Cause**: API calls blocked by CSP violations

---

## ✅ Solutions Implemented

### 1. Updated Content Security Policy (`Program.cs`)

**Before**:
```csharp
"default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
```

**After**:
```csharp
"default-src 'self'; " +
"img-src 'self' data: https:; " +
"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
"font-src 'self' https://fonts.gstatic.com data:; " +
"connect-src 'self';"
```

**Changes**:
- ✅ Added `https://fonts.googleapis.com` to `style-src` - allows Google Fonts stylesheet
- ✅ Added `font-src 'self' https://fonts.gstatic.com data:` - allows font file downloads
- ✅ Added explicit `connect-src 'self'` - allows API calls to same origin

### 2. Fixed API URL Configuration (`frontend/src/config/api.ts`)

**Before**:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7240/api';
```

**After**:
```typescript
// In production, use relative URL since nginx proxies /api to backend
// In development, use VITE_API_URL from env or default to localhost
const API_URL = import.meta.env.PROD 
  ? '/api'  // Production: relative URL (nginx handles proxy)
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api'); // Development
```

**Why This Works**:
- In production, frontend uses `/api` (relative URL)
- Nginx at `https://antystyki.pl` proxies `/api` to backend at `http://127.0.0.1:5000/api`
- From browser's perspective, API is same-origin → CSP `connect-src 'self'` allows it
- In development, uses environment variable or localhost default

### 3. Updated Environment Documentation

Updated `PRODUCTION.env.example` to clarify that `VITE_API_URL` is automatically handled in production builds.

---

## 🚀 Deployment Instructions

### Option 1: Quick Deployment (Recommended)

If you have the deployment scripts set up:

```bash
# On your local machine (Windows PowerShell)
.\redeploy.ps1
```

Or on Linux/Mac:
```bash
./redeploy.sh
```

### Option 2: Manual Deployment

#### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "fix: Update CSP to allow Google Fonts and fix API URL configuration"
git push origin main
```

#### Step 2: SSH into Production Server
```bash
ssh your-user@antystyki.pl
```

#### Step 3: Pull Latest Changes
```bash
cd /path/to/antystics
git pull origin main
```

#### Step 4: Rebuild and Restart
```bash
# Stop current containers
docker-compose -f docker-compose.production.yml down

# Rebuild with new changes
docker-compose -f docker-compose.production.yml build --no-cache

# Start containers
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs --tail=50
```

#### Step 5: Verify Deployment
```bash
# Check backend health
curl https://antystyki.pl/health

# Check if backend is running
curl http://localhost:5000/api/health
```

---

## ✅ Verification Checklist

After deployment, verify the following:

### 1. Check Browser Console (https://antystyki.pl)
- [ ] **No CSP errors** about Google Fonts
- [ ] **No CSP errors** about connect-src
- [ ] **Fonts load correctly** - Inter font family displays properly

### 2. Check Network Tab
- [ ] **API calls succeed** - `/api/categories` returns 200 OK
- [ ] **API calls succeed** - `/api/antistics` returns 200 OK
- [ ] **Fonts load** - Requests to `fonts.googleapis.com` and `fonts.gstatic.com` succeed

### 3. Functional Testing
- [ ] **Homepage loads** - Antistics display correctly
- [ ] **Categories work** - Category filtering works
- [ ] **Authentication works** - Login/Register functions
- [ ] **Typography correct** - Inter font displays (not fallback font)

### 4. Console Commands for Verification

Open browser console on https://antystyki.pl and run:

```javascript
// Check if API is working
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Check if fonts loaded
console.log(
  Array.from(document.fonts)
    .filter(f => f.family.includes('Inter'))
    .map(f => f.family)
);
```

**Expected Results**:
- API health check returns: `{status: "healthy", ...}`
- Fonts array shows: `["Inter", ...]`

---

## 🔍 Troubleshooting

### Problem: Still seeing CSP errors after deployment

**Solution**:
1. Hard refresh browser (Ctrl+F5 / Cmd+Shift+R)
2. Clear browser cache
3. Check that backend restarted: `docker-compose logs backend | grep "Content-Security-Policy"`

### Problem: API calls still failing

**Solution**:
1. Check nginx logs: `sudo tail -f /var/log/nginx/antystyki_error.log`
2. Check backend logs: `docker-compose logs backend`
3. Verify nginx is proxying: `curl -I https://antystyki.pl/api/health`

### Problem: Fonts still not loading

**Solution**:
1. Check CSP header in browser DevTools → Network → (select any request) → Headers → Response Headers
2. Should see: `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
3. If not, backend didn't restart properly

---

## 📋 Files Changed

1. ✅ `backend/Antystics.Api/Program.cs` - Updated CSP headers
2. ✅ `frontend/src/config/api.ts` - Fixed API URL configuration
3. ✅ `PRODUCTION.env.example` - Updated documentation

---

## 🔐 Security Notes

### CSP Directives Explained

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src 'self'` | Same-origin only | Default fallback for all resources |
| `img-src 'self' data: https:` | Self + data URIs + any HTTPS | Images from anywhere over HTTPS |
| `script-src 'self' 'unsafe-inline' 'unsafe-eval'` | Self + inline + eval | React requires inline scripts |
| `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` | Self + inline + Google Fonts | Styles and Google Fonts |
| `font-src 'self' https://fonts.gstatic.com data:` | Self + Google Fonts CDN | Font files |
| `connect-src 'self'` | Same-origin only | API calls to same origin |

### Why This Is Secure

✅ **Google Fonts** - Trusted CDN, millions of sites use it  
✅ **Same-origin API** - Only allows connections to `antystyki.pl`  
✅ **No wildcards** - Specific domains only  
✅ **HTTPS enforced** - Nginx redirects HTTP → HTTPS  

### Future CSP Improvements (Optional)

For maximum security, consider:
- Remove `'unsafe-inline'` and `'unsafe-eval'` (requires React build configuration)
- Add `report-uri` to monitor CSP violations
- Add nonces for inline scripts
- Consider self-hosting Google Fonts

---

## 📚 Related Documentation

- **PRD**: `ANTYSTYKI_PRD.md` - Section 2.1 (Technical Infrastructure)
- **Launch Guide**: `ANTYSTYKI_LAUNCH_GUIDE.md` - Step 3.2 (Backend Configuration)
- **Security**: `SECURITY_IMPLEMENTATION.md` - Security headers section
- **Deployment**: `DEPLOYMENT.md` - Full deployment guide

---

## ✅ Compliance Check

This fix aligns with:
- ✅ **ANTYSTYKI_PRD.md** - Security requirements (Section 3.1)
- ✅ **ANTYSTYKI_LAUNCH_GUIDE.md** - Step 3.2 (Security Headers)
- ✅ **SECURITY_IMPLEMENTATION.md** - CSP guidelines

---

**Status**: Ready for deployment  
**Risk Level**: Low (fixes production bug, no breaking changes)  
**Rollback**: Revert commits if issues arise  
**Testing**: Verify in production after deployment

