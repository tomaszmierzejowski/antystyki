# 🔐 Quick Secrets Reference

## TL;DR - Which File Should I Use?

```
┌─────────────────────────────────────────────────────┐
│  What are you doing?                                │
├─────────────────────────────────────────────────────┤
│  Running dotnet run (no Docker)                     │
│  → Use: dotnet user-secrets                         │
│  → Location: %APPDATA%\Microsoft\UserSecrets\...    │
├─────────────────────────────────────────────────────┤
│  Running docker-compose up                          │
│  → Use: .env file in project root                   │
│  → Copy from: PRODUCTION.env.example                │
├─────────────────────────────────────────────────────┤
│  Deploying to production server                     │
│  → Use: .env file on server                         │
│  → Or: Cloud provider secrets (Azure Key Vault)     │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Already Configured (You're Good!)

✅ User secrets initialized  
✅ Database connection configured  
✅ JWT secret configured  
✅ Hardcoded passwords removed from appsettings.json  
✅ .env properly in .gitignore  

---

## ⚠️ TODO: Update These Secrets

### 1. Email Credentials (Required for user registration)

```powershell
cd backend/Antystics.Api
dotnet user-secrets set "Email:SmtpUser" "your-actual-email@gmail.com"
dotnet user-secrets set "Email:SmtpPassword" "your-actual-app-password"
```

**Get Gmail App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Generate new app password
3. Copy the 16-character password

### 2. For Docker Development (Optional)

```powershell
# Create .env from template
cp PRODUCTION.env.example .env

# Edit .env with your actual secrets
notepad .env
```

---

## 🚀 Quick Commands

### View Current Secrets
```powershell
cd backend/Antystics.Api
dotnet user-secrets list
```

### Set a Secret
```powershell
cd backend/Antystics.Api
dotnet user-secrets set "Key:Subkey" "value"
```

### Test Your Setup
```powershell
# Start PostgreSQL (if using Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=Quake112 -e POSTGRES_DB=antystics postgres:15

# Run the API
cd backend/Antystics.Api
dotnet run
```

Open http://localhost:5000/api/health - should show "healthy"

---

## 📁 File Structure

```
antystics/
├── .env                          ❌ DON'T commit (for Docker)
├── .env.example                  ✅ Can commit (template)
├── PRODUCTION.env.example        ✅ Can commit (production template)
├── backend/
│   └── Antystics.Api/
│       ├── appsettings.json      ✅ Can commit (no secrets!)
│       └── appsettings.Development.json ✅ Can commit
└── %APPDATA%\Microsoft\UserSecrets\
    └── {guid}\
        └── secrets.json          ✅ Safe (outside repo)
```

---

## 🎯 Configuration Priority

```
Lowest  → appsettings.json (placeholders)
   ↓    → appsettings.Development.json
   ↓    → User Secrets (dev only)
   ↓    → Environment Variables (.env via Docker)
Highest → Command Line Arguments
```

**Last one wins!** So environment variables override appsettings.json.

---

## ❓ Common Questions

**Q: My app can't connect to database!**  
A: Run `dotnet user-secrets list` to verify connection string is set.

**Q: Email isn't working!**  
A: Update Email:SmtpUser and Email:SmtpPassword with real Gmail credentials.

**Q: Does my .env file work?**  
A: Only when running with `docker-compose up`. For `dotnet run`, use user secrets.

**Q: How do I see my secrets.json file?**  
A: Run `dotnet user-secrets list` or check `%APPDATA%\Microsoft\UserSecrets\{UserSecretsId}\secrets.json`

**Q: Should I commit appsettings.json?**  
A: ✅ YES - but it should only have placeholders, never real passwords.

---

## 📚 Full Documentation

- **SECRETS_MANAGEMENT_GUIDE.md** - Complete guide you're reading
- **PRODUCTION.env.example** - Production environment template
- **ENV_TEMPLATE.txt** - Alternative environment template
- **PRODUCTION_SETUP.md** - Full deployment guide

---

## 🆘 Something Broken?

1. Check user secrets: `dotnet user-secrets list`
2. Check appsettings have placeholders (no real passwords)
3. Make sure .env exists if using Docker
4. Check logs: Application should show which config it loaded

**Still stuck?** Check the full guide: `SECRETS_MANAGEMENT_GUIDE.md`

