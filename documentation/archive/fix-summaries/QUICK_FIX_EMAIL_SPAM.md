# Quick Fix: Email Spam Rejection

**Problem**: Emails rejected by WP.pl, O2.pl as spam  
**Error**: `554 (#5.3.0) Nie przyjmiemy tej wiadomosci poniewaz jest to spam`  
**Fix Time**: 5 minutes ⚡

---

## ⚡ Quick Solution (Do This Now)

### Step 1: SSH to Server
```bash
ssh your-user@antystyki.pl
cd /path/to/antystics
```

### Step 2: Edit .env File
```bash
nano .env
```

### Step 3: Match FROM Address to SMTP User

**Find these lines:**
```bash
SMTP_USER=your-email@gmail.com
EMAIL_FROM_ADDRESS=noreply@antystyki.pl
```

**Change to (use SAME email for both):**
```bash
SMTP_USER=your-email@gmail.com
EMAIL_FROM_ADDRESS=your-email@gmail.com  # ← Changed to match SMTP_USER
```

**Save**: Ctrl+X, Y, Enter

### Step 4: Restart App
```bash
docker-compose -f docker-compose.production.yml restart app
```

### Step 5: Test
Register with a WP.pl or O2.pl email address. Email should now be delivered.

---

## Why This Works

**Before** (rejected as spam):
- Sending FROM: `noreply@antystyki.pl` (your domain)
- Through SMTP: `smtp.gmail.com` (Google's servers)
- ❌ Mismatch = Looks like spoofing = Spam filter blocks it

**After** (delivered):
- Sending FROM: `your-email@gmail.com` (Gmail)
- Through SMTP: `smtp.gmail.com` (Gmail)
- ✅ Match = Legitimate sender = Delivered

---

## 📋 Full Configuration Example

Your `.env` should look like this:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-actual-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM_ADDRESS=your-actual-email@gmail.com  # ← SAME as SMTP_USER!
EMAIL_FROM_NAME=Antystyki

# Frontend
FRONTEND_URL=https://antystyki.pl

# Other settings...
POSTGRES_PASSWORD=your-db-password
JWT_SECRET=your-jwt-secret
```

---

## ✅ Verification

After restarting, check:

```bash
# 1. Verify environment
docker exec antystics-app env | grep EMAIL

# Should show:
# Email__FromAddress=your-email@gmail.com
# Email__SmtpUser=your-email@gmail.com

# 2. Test email delivery
# Register at https://antystyki.pl/register with:
# - WP.pl email address
# - O2.pl email address
# - Should receive verification emails
```

---

## 📚 More Information

For detailed explanations and alternative solutions:
- **EMAIL_DELIVERABILITY_FIX.md** - Complete guide with 3 options
- **PRODUCTION_ISSUES_FIX_SUMMARY.md** - All production issues

---

## 🎯 Future Improvements (Optional)

### Option A: Use Custom Domain (Professional)
Add SPF record to DNS to use `noreply@antystyki.pl`:
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.google.com ~all
```
See **EMAIL_DELIVERABILITY_FIX.md Option 2**

### Option B: Use SendGrid (Best Deliverability)
Free 100 emails/day, best spam score:
- Sign up: https://sendgrid.com/
- See **EMAIL_DELIVERABILITY_FIX.md Option 3**

---

**This quick fix will immediately solve spam rejection issues!** 🎉

