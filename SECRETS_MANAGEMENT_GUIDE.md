# Secrets Management Guide for Antystyki

## 🔐 Understanding the Secret Management System

You have **3 different ways** to provide secrets to your application. Here's when to use each:

| Method | Use Case | Priority | Security |
|--------|----------|----------|----------|
| **User Secrets** | Local development (Windows/Mac) | Medium | ✅ Secure |
| **.env Files** | Docker/Production | High | ✅ Secure (if gitignored) |
| **appsettings.json** | Default values/placeholders only | Low | ❌ Never put real secrets here |

---

## 📚 How ASP.NET Core Configuration Priority Works

ASP.NET Core loads configuration in this order (last one wins):

1. `appsettings.json` ← Base configuration (PLACEHOLDERS ONLY)
2. `appsettings.{Environment}.json` ← Environment-specific overrides
3. **User Secrets** ← Local development secrets (Development only)
4. **Environment Variables** ← Production secrets (from .env via Docker)
5. Command Line Arguments ← Highest priority

---

## 🛠️ Local Development Setup (Your Current Setup)

### ✅ Step 1: User Secrets Are Already Configured!

I've already set up your user secrets. To view them:

```powershell
cd backend/Antystics.Api
dotnet user-secrets list
```

You should see:
```
ConnectionStrings:DefaultConnection = Host=localhost;Port=5432;Database=antystics;Username=postgres;Password=Quake112;Include Error Detail=true
Jwt:Secret = b883Dk5oogWBKeIbt8YAbsfbwcyA-KHPTttVwmvx-jrL-xDun6Pnn2g5XA6BIQ8O
Email:SmtpUser = your-email@gmail.com
Email:SmtpPassword = your-gmail-app-password
```

### ✅ Step 2: Update Your Email Credentials

Replace the placeholder email credentials:

```powershell
cd backend/Antystics.Api
dotnet user-secrets set "Email:SmtpUser" "your-actual-email@gmail.com"
dotnet user-secrets set "Email:SmtpPassword" "your-actual-gmail-app-password"
```

### 📍 Where Are User Secrets Stored?

User secrets are stored in:
```
%APPDATA%\Microsoft\UserSecrets\{UserSecretsId}\secrets.json
```

They are **NOT** in your project folder and **NEVER** committed to Git.

---

## 🐳 Docker/Production Setup (.env Files)

### Step 1: Create `.env` File in Project Root

Copy the template:

```powershell
# In project root (antystics/)
cp PRODUCTION.env.example .env
```

### Step 2: Edit `.env` with Your Production Secrets

```env
# Database
POSTGRES_DB=antystics
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password-here

# JWT
JWT_SECRET=your-jwt-secret-here
JWT_ISSUER=Antystics
JWT_AUDIENCE=AntysticsUsers

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM_ADDRESS=noreply@antystyki.pl
EMAIL_FROM_NAME=Antystyki

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 3: Docker Compose Uses .env Automatically

When you run:
```powershell
docker-compose up
```

Docker automatically reads `.env` and passes environment variables to containers.

---

## 🔄 How It Works

### Local Development (Without Docker)

```
User Secrets → ASP.NET Core App
```

When you run `dotnet run`, ASP.NET Core automatically loads user secrets.

### Docker Development/Production

```
.env file → Docker Compose → Environment Variables → ASP.NET Core App
```

Docker Compose reads `.env` and sets environment variables in the container.

---

## 🚀 Quick Commands Reference

### View Your Current User Secrets
```powershell
cd backend/Antystics.Api
dotnet user-secrets list
```

### Set a New Secret
```powershell
cd backend/Antystics.Api
dotnet user-secrets set "Key:Subkey" "value"
```

### Remove a Secret
```powershell
cd backend/Antystics.Api
dotnet user-secrets remove "Key:Subkey"
```

### Clear All Secrets
```powershell
cd backend/Antystics.Api
dotnet user-secrets clear
```

---

## ❓ FAQ

### Q: Why doesn't ASP.NET Core read my .env file directly?

**A:** ASP.NET Core doesn't read `.env` files by default. The `.env` files are used by:
- Docker Compose (which passes them as environment variables)
- Node.js/Frontend tools (which have built-in .env support)

You have two options:
1. **Recommended**: Use User Secrets for local dev, .env for Docker/production
2. **Alternative**: Install a library like `DotNetEnv` to read .env files (see below)

### Q: Should I copy my .env into secrets.json?

**A:** No! They serve different purposes:
- **User Secrets**: For local development without Docker
- **.env**: For Docker containers (dev and production)

### Q: Can I use .env files directly in ASP.NET Core?

**A:** Yes, but you need to add the `DotNetEnv` package. See "Advanced: Using .env Files Directly" section below.

### Q: Which secrets file should I edit?

Use this flowchart:

```
Are you running with Docker?
├─ YES → Edit .env in project root
└─ NO → Use dotnet user-secrets commands
```

---

## 🎯 Recommended Workflow

### For Local Development (No Docker)

1. Use `dotnet user-secrets` commands
2. Never commit secrets
3. Keep appsettings.json with placeholders only

### For Docker Development

1. Copy `PRODUCTION.env.example` to `.env`
2. Edit `.env` with your secrets
3. Run `docker-compose up`
4. Never commit `.env` file

### For Production Deployment

1. Use `.env` file on the server
2. Or use cloud provider's secrets management (Azure Key Vault, AWS Secrets Manager, etc.)
3. Set environment variables directly in hosting environment

---

## 🔧 Advanced: Using .env Files Directly (Optional)

If you want ASP.NET Core to read `.env` files directly without Docker:

### Step 1: Add DotNetEnv Package

```powershell
cd backend/Antystics.Api
dotnet add package DotNetEnv
```

### Step 2: Update Program.cs

Add this at the very top of `Program.cs`:

```csharp
using DotNetEnv;

// Load .env file if it exists
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "../../.env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

var builder = WebApplication.CreateBuilder(args);
// ... rest of your code
```

Now your app will read `.env` files directly!

---

## ✅ Security Checklist

- [x] Remove hardcoded passwords from appsettings.json
- [x] User secrets initialized and configured
- [x] `.env` file in `.gitignore`
- [ ] Update Email credentials in user secrets with real values
- [ ] Create `.env` file for Docker deployment
- [ ] Never commit secrets to Git
- [ ] Use strong passwords (32+ characters for DB, 64+ for JWT)

---

## 📝 Summary

**You're all set!** 

- ✅ **Local Development**: User secrets are configured - just update email credentials
- ✅ **Docker/Production**: Use `.env` file (copy from `PRODUCTION.env.example`)
- ✅ **Security**: Hardcoded passwords removed from appsettings.json

Your app will automatically use the correct secrets based on how it's running:
- `dotnet run` → User Secrets
- `docker-compose up` → .env file

---

## 🆘 Need Help?

Check these files:
- `PRODUCTION.env.example` - Template for .env file
- `ENV_TEMPLATE.txt` - Additional environment variable examples
- `PRODUCTION_SETUP.md` - Full production deployment guide
- `SECURITY_IMPLEMENTATION.md` - Security best practices

