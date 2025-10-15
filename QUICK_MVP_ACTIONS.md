# 🚀 Quick MVP Actions - Do This First!

This is your **immediate action checklist** for getting to production FAST.

## ⚡ 30-Minute Security Sprint (Do Right Now!)

These are the absolute minimum changes needed before you can even think about production:

### 1. Remove Hardcoded Passwords (5 minutes)

**File:** `backend/Antystics.Api/appsettings.json`

Current line 3 has your password visible:
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=antystics;Username=postgres;Password=Quake112;Include Error Detail=true"
```

**Action:** Replace with:
```json
"DefaultConnection": "Host=localhost;Port=5432;Database=antystics;Username=postgres;Password=postgres;Include Error Detail=true"
```

**Then:** Create `backend/appsettings.Production.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=postgres;Database=antystics;Username=postgres;Password=USE_ENV_VARIABLE"
  },
  "Jwt": {
    "Secret": "USE_ENV_VARIABLE",
    "Issuer": "Antystics",
    "Audience": "AntysticsUsers"
  },
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "SmtpUser": "USE_ENV_VARIABLE",
    "SmtpPassword": "USE_ENV_VARIABLE",
    "FromAddress": "noreply@antystyki.pl",
    "FromName": "Antystyki"
  }
}
```

### 2. Generate Strong JWT Secret (2 minutes)

Run this command:
```bash
openssl rand -base64 48
```

Output example: `7vK9xPm2wQ8sL4nR6tY1uZ3bA5cD8eF0gH2iJ4kL7mN9oP1qR3sT5uV8wX0yZ2`

Copy this! You'll need it for `.env` files.

### 3. Create Environment Files (10 minutes)

**Root `.env`:**
```bash
cat > .env << 'EOF'
POSTGRES_DB=antystics
POSTGRES_USER=postgres
POSTGRES_PASSWORD=PUT_YOUR_STRONG_DB_PASSWORD_HERE

ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET=PUT_YOUR_JWT_SECRET_FROM_STEP_2_HERE
JWT_ISSUER=Antystics
JWT_AUDIENCE=AntysticsUsers

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM_ADDRESS=noreply@antystyki.pl
EMAIL_FROM_NAME=Antystyki

VITE_API_URL=http://localhost:5000/api
EOF
```

**Frontend `.env`:**
```bash
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5000/api
EOF
```

### 4. Enable HTTPS in Backend (3 minutes)

**File:** `backend/Antystics.Api/Program.cs`

Find line 77:
```csharp
options.RequireHttpsMetadata = false; // Set to true in production
```

Change to:
```csharp
options.RequireHttpsMetadata = true; // SECURITY: Require HTTPS in production
```

### 5. Update CORS Origins (5 minutes)

**File:** `backend/Antystics.Api/Program.cs`

Find lines 104-110, change from:
```csharp
policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
```

To:
```csharp
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };
    
policy.WithOrigins(allowedOrigins)
```

**Then add to `appsettings.Production.json`:**
```json
{
  "AllowedOrigins": [
    "https://antystyki.pl",
    "https://www.antystyki.pl"
  ]
}
```

### 6. Add Security Headers (5 minutes)

**File:** `backend/Antystics.Api/Program.cs`

After line 112 (`var app = builder.Build();`), add:

```csharp
// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    
    await next();
});
```

---

## ✅ Done! Now You Can Deploy

After these 30 minutes of work, your application is MUCH safer and ready for production deployment.

---

## 📧 Email Setup (15 minutes - Do Before Launch)

You need working email for user verification to work.

### Quick Gmail Setup

1. **Go to Gmail Account Settings**
   - https://myaccount.google.com/security

2. **Enable 2-Factor Authentication**
   - Required for app passwords

3. **Generate App Password**
   - https://myaccount.google.com/apppasswords
   - App: Mail
   - Device: Other (Antystics)
   - Copy the 16-character password

4. **Update `.env` file**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   EMAIL_FROM_ADDRESS=your-email@gmail.com
   ```

5. **Test it**:
   - Register a new account
   - Check your email for verification

---

## 🎯 Pre-Launch Checklist (Before Going Live)

Print this and check off each item:

- [ ] Changed database password from default
- [ ] Generated new JWT secret (64+ characters)
- [ ] Created all `.env` files
- [ ] Updated `RequireHttpsMetadata` to `true`
- [ ] Updated CORS to production domain
- [ ] Added security headers
- [ ] Set up email service (Gmail or SendGrid)
- [ ] Tested email verification works
- [ ] Changed default admin password
- [ ] Domain name is purchased and configured
- [ ] SSL certificate is ready (Let's Encrypt)
- [ ] Server is provisioned (2GB RAM minimum)
- [ ] Firewall is configured (ports 80, 443, 22 only)
- [ ] Backups are configured
- [ ] Monitoring is set up (UptimeRobot)
- [ ] Tested full user flow (register → verify → login → create)
- [ ] Added Privacy Policy page (legal requirement!)
- [ ] Added Terms of Service page (legal requirement!)

---

## 🔥 Emergency Security Issues to Fix

### CRITICAL - Fix Immediately

1. **Exposed Password in Git**
   - `appsettings.json` has `Password=Quake112`
   - This is committed to git!
   - **Action**: Change database password immediately
   - **Action**: Remove from file and use environment variables

2. **Weak JWT Secret**
   - `your-super-secret-key-change-this-in-production-min-32-chars-long`
   - This is too simple and predictable
   - **Action**: Generate random 64-character secret

3. **Missing CAPTCHA**
   - Registration has no bot protection
   - **Action**: Add reCAPTCHA (see `CAPTCHA_IMPLEMENTATION.md`)

4. **No Rate Limiting**
   - API can be spammed
   - **Action**: Add rate limiting middleware

---

## 📊 What's the Absolute Minimum for MVP?

If you're in a hurry and need to launch ASAP, here's the bare minimum:

### Must Have (Can't Launch Without):
1. ✅ Security fixes above (30 min)
2. ✅ Email service working (15 min)
3. ✅ Changed admin password (2 min)
4. ✅ HTTPS/SSL certificate (30 min)
5. ✅ Server deployed (1 hour)
6. ✅ Privacy Policy + ToS pages (2 hours)

**Total: ~4 hours minimum**

### Should Have (Launch Without, Add Within Week 1):
- CAPTCHA protection
- Rate limiting
- Automated backups
- Monitoring/alerts
- Error tracking

### Nice to Have (Add Within Month 1):
- Analytics
- Comments system
- Full i18n (Polish + English)
- Advanced search
- User profiles

---

## 🚀 Fastest Path to Production

1. **Morning (3 hours):**
   - Do 30-min security sprint
   - Set up email service
   - Create production server
   - Deploy with Docker Compose

2. **Afternoon (3 hours):**
   - Set up Nginx + SSL
   - Test everything
   - Write Privacy Policy + ToS
   - Add pages to frontend

3. **Evening (2 hours):**
   - Final testing
   - Set up monitoring
   - Configure backups
   - Announce launch!

**Total: 1 day from start to production**

---

## 💡 Pro Tips

1. **Don't overthink it** - MVP means Minimum Viable Product
2. **Security first** - But don't let perfect be enemy of good
3. **Launch fast, iterate faster** - Get real user feedback ASAP
4. **Monitor closely** - First 48 hours are critical
5. **Have rollback plan** - Keep old version running just in case

---

## 🆘 If Something Breaks

### Backend won't start?
```bash
docker-compose logs backend
# Usually: database connection or missing .env
```

### Frontend shows errors?
```bash
# Check .env has correct API URL
cat frontend/.env
# Should be: VITE_API_URL=http://localhost:5000/api
```

### Emails not sending?
```bash
# Test SMTP connection
telnet smtp.gmail.com 587
# Check Email settings in .env
```

### Can't login as admin?
```bash
# Reset admin password through database
docker exec -it antystics-db psql -U postgres antystics
# Or check Program.cs seed data
```

---

## 📞 Need Help?

- Check `PRODUCTION_SETUP.md` for detailed steps
- Check `MVP_PRODUCTION_CHECKLIST.md` for full checklist
- Check `DEPLOYMENT.md` for deployment guide
- Open GitHub issue if stuck

---

**Remember**: Done is better than perfect!

Your MVP doesn't need every feature. It needs to:
1. Work
2. Be secure
3. Solve a real problem
4. Get user feedback

Everything else can be added later.

**Now go launch! 🚀**

