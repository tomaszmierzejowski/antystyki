# Frontend Fix & SEO Files Deployment Guide

**Issue**: Frontend unavailable at antystyki.pl, SEO files location confusion  
**Root Cause**: Missing SPA fallback routing in ASP.NET backend  
**Solution**: Added `MapFallbackToFile("index.html")` + Vite config updates  
**Status**: ✅ Fixed - Ready to redeploy  

---

## 🏗️ Architecture Overview

### How the Unified Container Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Build Process                      │
└─────────────────────────────────────────────────────────────┘

Step 1: Build Frontend (Node.js)
   frontend/public/robots.txt     ─┐
   frontend/public/sitemap.xml    ├─► Vite Build
   frontend/public/og-image.png   ─┘      │
   frontend/src/**/*.tsx                   ▼
                                   frontend/dist/
                                   ├── index.html
                                   ├── assets/
                                   ├── robots.txt     ✅
                                   ├── sitemap.xml    ✅
                                   └── og-image.png   ✅

Step 2: Build Backend (.NET 9)
   backend/Antystics.Api/**/*.cs  ─► dotnet publish
                                           │
                                           ▼
                                   /app/publish/

Step 3: Runtime Container
   frontend/dist/*  ─────► /app/wwwroot/
                           ├── index.html
                           ├── robots.txt     ✅
                           ├── sitemap.xml    ✅
                           └── assets/
   
   ASP.NET Core serves everything from /app/wwwroot/
   ├── /api/*          → Controllers
   ├── /health         → Health check
   ├── /uploads/*      → User uploads
   └── /*              → index.html (SPA fallback) ✅ FIXED
```

---

## 🔧 What Was Fixed

### 1. **Backend: Added SPA Fallback Routing**

**File**: `backend/Antystics.Api/Program.cs` (Line 217)

```csharp
// Before (BROKEN):
app.MapControllers();
// End of file - no fallback routing

// After (FIXED):
app.MapControllers();

// ✅ SPA Fallback: Serve React app for all non-API routes
app.MapFallbackToFile("index.html");
```

**What this does**:
- Routes like `/about`, `/privacy`, `/create` now return `index.html`
- React Router takes over and shows the correct component
- Before: 404 errors for all non-API routes
- After: Frontend works correctly

---

### 2. **Frontend: Explicit Vite Configuration**

**File**: `frontend/vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  
  // Ensure public assets are copied to dist
  publicDir: 'public',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    copyPublicDir: true,  // ✅ Copy robots.txt, sitemap.xml, etc.
  },
})
```

**What this does**:
- Explicitly tells Vite to copy `frontend/public/*` to `dist/`
- Ensures `robots.txt`, `sitemap.xml`, `og-image.png` are in production build

---

### 3. **SEO Files Location**

```bash
# ✅ CORRECT: Source code (local development)
frontend/public/
├── robots.txt        # You created this ✅
├── sitemap.xml       # You created this ✅
├── og-image.png      # User needs to create
├── twitter-card.png  # User needs to create
├── logo.png          # User needs to create
└── .htaccess         # You created this ✅

# ✅ CORRECT: After Vite build (local)
frontend/dist/
├── index.html
├── assets/
├── robots.txt        # Copied by Vite
└── sitemap.xml       # Copied by Vite

# ✅ CORRECT: Production (inside Docker container)
/app/wwwroot/
├── index.html
├── assets/
├── robots.txt        # Copied from dist
├── sitemap.xml       # Copied from dist
└── uploads/          # User uploads (runtime)

# ❌ WRONG: This directory doesn't exist!
/var/www/antystyki/frontend/public/  # Don't look here!
```

---

## 🚀 How to Deploy the Fix

### Option 1: Automated Deployment (Recommended)

If you have GitHub Actions configured:

```bash
# On your local machine:
git add .
git commit -m "Fix: Add SPA fallback routing and SEO files"
git push origin main

# GitHub Actions will:
# 1. Build new Docker image
# 2. Wait for your approval
# 3. Deploy to production
# 4. Run health checks
# 5. Rollback if failed
```

---

### Option 2: Manual Deployment from Local Machine

```powershell
# Windows PowerShell

# Navigate to project root
cd C:\Users\tmier\source\repos\antystics

# Step 1: Test locally (optional but recommended)
cd frontend
npm run build
# Verify dist/robots.txt exists:
ls dist/robots.txt  # Should show file

cd ..

# Step 2: SSH to server
ssh antystyki@YOUR_SERVER_IP

# Step 3: On server - backup current deployment
cd /var/www/antystyki
sudo cp -r . ../antystyki-backup-$(date +%Y%m%d-%H%M%S)

# Step 4: On server - pull latest code
git pull origin main

# Step 5: On server - rebuild and restart containers
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Step 6: Watch logs for errors
docker-compose -f docker-compose.production.yml logs -f app

# Wait until you see:
# "Application started. Press Ctrl+C to shut down."

# Step 7: Test (Ctrl+C to exit logs)
curl http://localhost:5000/api/health
# Should return: {"status":"healthy",...}

curl http://localhost:5000/robots.txt
# Should return: # Antystyki - Robots.txt...

# Exit SSH
exit
```

---

### Option 3: Manual Deployment from Server (if code already pushed)

```bash
# SSH to server
ssh antystyki@YOUR_SERVER_IP

# Navigate to project
cd /var/www/antystyki

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache app
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# Test
curl http://localhost:5000/api/health
curl http://localhost:5000/robots.txt
```

---

## ✅ Verification Checklist

### After Deployment

```bash
# 1. Check API health
curl https://antystyki.pl/api/health
# Expected: {"status":"healthy",...}

# 2. Check frontend loads
curl https://antystyki.pl/
# Expected: HTML with <!doctype html>...

# 3. Check robots.txt
curl https://antystyki.pl/robots.txt
# Expected: # Antystyki - Robots.txt...

# 4. Check sitemap.xml
curl https://antystyki.pl/sitemap.xml
# Expected: <?xml version="1.0"...

# 5. Check SPA routing
curl https://antystyki.pl/about
# Expected: Same HTML as homepage (React Router handles it)

# 6. Check in browser
# Open: https://antystyki.pl
# Should see: Antystyki homepage

# 7. Test navigation
# Click: Privacy Policy, Terms, etc.
# Should work without 404 errors
```

---

## 🐛 Troubleshooting

### Issue: Frontend still shows 404

```bash
# Check if app container is running
docker ps | grep antystics-app

# Check app logs
docker logs antystics-app

# Look for errors about static files or routing

# Restart container
docker-compose -f docker-compose.production.yml restart app
```

---

### Issue: robots.txt not found

```bash
# Verify file exists in container
docker exec antystics-app ls -la /app/wwwroot/robots.txt

# If missing, check frontend build
docker exec antystics-app ls -la /app/wwwroot/

# If wwwroot is empty, rebuild without cache
docker-compose -f docker-compose.production.yml build --no-cache app
docker-compose -f docker-compose.production.yml up -d
```

---

### Issue: "Connection refused" errors

```bash
# Check if nginx is running
sudo systemctl status nginx

# Check if nginx is configured correctly
sudo nginx -t

# Check if app is listening on port 5000
docker exec antystics-app netstat -tlnp | grep 5000

# Restart nginx
sudo systemctl restart nginx
```

---

## 📝 Understanding the File Flow

### Development (Local)

```bash
# You edit files here:
frontend/public/robots.txt

# Vite dev server serves from here:
npm run dev
# Accessible at: http://localhost:5173/robots.txt

# Frontend talks to API:
VITE_API_URL=http://localhost:5000/api
```

### Production Build (Local)

```bash
# You run:
cd frontend
npm run build

# Vite creates:
frontend/dist/
├── index.html
├── assets/
│   ├── index-ABC123.js
│   └── index-DEF456.css
├── robots.txt        # ✅ Copied from public/
└── sitemap.xml       # ✅ Copied from public/

# This dist/ folder gets copied to Docker image
```

### Production Deployment (Server)

```bash
# Docker build process:
1. FROM node:20-alpine AS frontend-build
   WORKDIR /app/frontend
   RUN npm run build
   # Creates: /app/frontend/dist/

2. FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
   COPY --from=frontend-build /app/frontend/dist ./wwwroot/
   # Now: /app/wwwroot/robots.txt exists

3. ASP.NET Core serves from wwwroot:
   app.UseStaticFiles();
   app.MapFallbackToFile("index.html");

4. Nginx proxies to ASP.NET:
   location / {
       proxy_pass http://127.0.0.1:5000;
   }

5. User visits: https://antystyki.pl/robots.txt
   ├─► Nginx (port 443)
   ├─► ASP.NET (port 5000)
   └─► /app/wwwroot/robots.txt
```

---

## 🎯 Quick Reference

### Where SEO Files Live

| Environment | Location | Purpose |
|-------------|----------|---------|
| **Source Code** | `frontend/public/` | You edit here |
| **Local Build** | `frontend/dist/` | Vite output (gitignored) |
| **Docker Build** | `/app/frontend/dist/` | Inside build stage |
| **Production** | `/app/wwwroot/` | ASP.NET serves from here |
| **Public URL** | `https://antystyki.pl/robots.txt` | Users access here |

### Common Commands

```bash
# Local development:
npm run dev                          # Frontend with hot reload
dotnet run                           # Backend API

# Local build test:
npm run build                        # Creates dist/
ls frontend/dist/robots.txt          # Verify file exists

# Production deploy:
git push origin main                 # Trigger CI/CD
# OR
docker-compose -f docker-compose.production.yml up -d --build

# Production verify:
curl https://antystyki.pl/robots.txt
curl https://antystyki.pl/sitemap.xml
curl https://antystyki.pl/api/health
```

---

## 🚨 Important Notes

1. **Never edit files inside the Docker container**
   - Changes will be lost on restart
   - Always edit in `frontend/public/` and rebuild

2. **Always rebuild after changing public files**
   ```bash
   # Full rebuild required:
   docker-compose -f docker-compose.production.yml build --no-cache app
   ```

3. **Test locally before deploying**
   ```bash
   npm run build
   ls frontend/dist/robots.txt
   ```

4. **The `/var/www/antystyki/` directory structure**
   ```
   /var/www/antystyki/
   ├── backend/
   ├── frontend/
   │   ├── public/          # ✅ Edit here
   │   │   ├── robots.txt
   │   │   └── sitemap.xml
   │   ├── src/
   │   └── dist/            # Generated by build
   ├── docker-compose.production.yml
   └── Dockerfile.production
   ```

---

## ✅ Summary

### What Was Broken
- ❌ Frontend routes returned 404 (no SPA fallback)
- ❌ Confusion about where SEO files should be

### What Was Fixed
- ✅ Added `MapFallbackToFile("index.html")` in Program.cs
- ✅ Updated Vite config to explicitly copy public files
- ✅ Documented the file flow clearly

### Next Steps
1. **Create social media images** (see SEO_IMPLEMENTATION.md Action 1)
2. **Redeploy with the fix** (choose option above)
3. **Verify all endpoints work** (use checklist above)
4. **Submit sitemap to Google** (after deployment)

---

**Last Updated**: October 26, 2025  
**Status**: ✅ Ready to Deploy  
**Estimated Deployment Time**: 10-15 minutes

