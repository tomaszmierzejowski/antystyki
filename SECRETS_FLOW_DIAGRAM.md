# 🔐 Secrets Management Flow Diagram

## How Secrets Flow in Your Application

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT SCENARIOS                        │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│  Scenario 1: Local Development (dotnet run)                           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   You type: dotnet run                                                │
│        ↓                                                              │
│   ASP.NET Core loads config in order:                                │
│        ↓                                                              │
│   1. appsettings.json           → Password=PLACEHOLDER               │
│   2. appsettings.Development.json → (no overrides)                   │
│   3. User Secrets ✅            → Password=Quake112                  │
│   4. Environment Variables       → (none set)                        │
│        ↓                                                              │
│   Result: App uses Quake112 ✅                                       │
│                                                                        │
│   User Secrets Location:                                              │
│   %APPDATA%\Microsoft\UserSecrets\08f79b25-...\secrets.json          │
│   (Outside your repo, never committed to Git)                        │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│  Scenario 2: Docker Development (docker-compose up)                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   You type: docker-compose up                                         │
│        ↓                                                              │
│   Docker Compose reads .env file:                                     │
│        POSTGRES_PASSWORD=Quake112                                     │
│        JWT_SECRET=b883Dk5oogWBKeIbt8YAbsfbwcyA...                    │
│        SMTP_USER=your-email@gmail.com                                 │
│        ↓                                                              │
│   Docker Compose converts to ASP.NET format:                          │
│        JWT_SECRET → Jwt__Secret                                       │
│        SMTP_USER → Email__SmtpUser                                    │
│        ↓                                                              │
│   Passes as Environment Variables to container                       │
│        ↓                                                              │
│   ASP.NET Core in container loads:                                   │
│        1. appsettings.json       → Password=PLACEHOLDER              │
│        2. Environment Variables ✅ → Password=Quake112               │
│        ↓                                                              │
│   Result: App uses Quake112 ✅                                       │
│                                                                        │
│   .env file is in .gitignore (never committed)                       │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│  Scenario 3: Production Deployment                                    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   On production server:                                               │
│        ↓                                                              │
│   Create .env file with production secrets                           │
│        POSTGRES_PASSWORD=<strong-32-char-password>                    │
│        JWT_SECRET=<strong-64-char-secret>                            │
│        SMTP_USER=<production-email>                                   │
│        SMTP_PASSWORD=<production-password>                            │
│        CORS_ALLOWED_ORIGINS=https://antystyki.pl                     │
│        ↓                                                              │
│   Run: docker-compose -f docker-compose.production.yml up -d         │
│        ↓                                                              │
│   Same flow as Scenario 2, but with production values                │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         FILE STRUCTURE                               │
└─────────────────────────────────────────────────────────────────────┘

antystics/
├── .env                              ❌ NOT COMMITTED (in .gitignore)
│   └── Contains: Real secrets for Docker
│
├── PRODUCTION.env.example            ✅ COMMITTED (template)
│   └── Contains: Examples and placeholders
│
├── backend/Antystics.Api/
│   ├── appsettings.json              ✅ COMMITTED
│   │   └── Contains: Only PLACEHOLDERS
│   │
│   └── appsettings.Development.json  ✅ COMMITTED
│       └── Contains: Dev-specific config (no secrets)
│
└── %APPDATA%\Microsoft\UserSecrets\
    └── 08f79b25-.../secrets.json     ✅ SAFE (outside repo)
        └── Contains: Real dev secrets

┌─────────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION PRIORITY                            │
└─────────────────────────────────────────────────────────────────────┘

    Lowest Priority
         ↓
    ┌─────────────────────────────┐
    │  appsettings.json           │  ← Base config, PLACEHOLDERS only
    └─────────────────────────────┘
         ↓
    ┌─────────────────────────────┐
    │  appsettings.{Env}.json     │  ← Environment overrides
    └─────────────────────────────┘
         ↓
    ┌─────────────────────────────┐
    │  User Secrets               │  ← Dev secrets (Development only)
    └─────────────────────────────┘
         ↓
    ┌─────────────────────────────┐
    │  Environment Variables      │  ← Production secrets (.env)
    └─────────────────────────────┘
         ↓
    ┌─────────────────────────────┐
    │  Command Line Args          │  ← Highest priority
    └─────────────────────────────┘
         ↓
    Highest Priority

    Last one wins! ✅

┌─────────────────────────────────────────────────────────────────────┐
│                    DECISION FLOWCHART                                │
└─────────────────────────────────────────────────────────────────────┘

                     Need to run the app?
                            ↓
          ┌─────────────────┴─────────────────┐
          ↓                                   ↓
    With Docker?                        Without Docker?
          ↓                                   ↓
    Use .env file                       Use User Secrets
          ↓                                   ↓
    ┌──────────────┐                  ┌──────────────────┐
    │ 1. Copy:     │                  │ Commands:        │
    │    .env.ex..│                  │                  │
    │ 2. Edit .env │                  │ dotnet user-     │
    │ 3. docker-   │                  │   secrets set    │
    │    compose up│                  │   "Key" "Val"    │
    └──────────────┘                  └──────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    VARIABLE NAME FORMATS                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────┬───────────────────────────────────────────────┐
│  Format             │  Used In                                      │
├─────────────────────┼───────────────────────────────────────────────┤
│  Jwt:Secret         │  • User Secrets                               │
│  (colon)            │  • appsettings.json                           │
│                     │  • C# code: Configuration["Jwt:Secret"]       │
├─────────────────────┼───────────────────────────────────────────────┤
│  Jwt__Secret        │  • Environment Variables (direct)             │
│  (double underscore)│  • Docker Compose environment section         │
│                     │  • PowerShell: $env:Jwt__Secret               │
├─────────────────────┼───────────────────────────────────────────────┤
│  JWT_SECRET         │  • .env file (simple format)                  │
│  (uppercase snake)  │  • Docker Compose converts to Jwt__Secret     │
└─────────────────────┴───────────────────────────────────────────────┘

Example Conversion:
    .env file:        JWT_SECRET=myvalue
         ↓
    Docker Compose:   Jwt__Secret=myvalue (in container)
         ↓
    ASP.NET Core:     Configuration["Jwt:Secret"] → "myvalue"

┌─────────────────────────────────────────────────────────────────────┐
│                    CURRENT STATUS                                    │
└─────────────────────────────────────────────────────────────────────┘

✅ User Secrets initialized
✅ Database password set in User Secrets
✅ JWT secret set in User Secrets
⚠️  Email credentials set (need real values)
✅ Hardcoded passwords removed from appsettings.json
✅ docker-compose.yml configured to read .env
✅ .env in .gitignore
⚠️  .env file needs to be created (for Docker usage)

┌─────────────────────────────────────────────────────────────────────┐
│                    YOUR NEXT STEPS                                   │
└─────────────────────────────────────────────────────────────────────┘

For Local Development (dotnet run):
  1. Update email credentials:
     cd backend/Antystics.Api
     dotnet user-secrets set "Email:SmtpUser" "real-email@gmail.com"
     dotnet user-secrets set "Email:SmtpPassword" "real-app-password"
  
  2. Test:
     dotnet run
     Open: http://localhost:5000/api/health

For Docker Development:
  1. Create .env:
     cp PRODUCTION.env.example .env
     notepad .env
  
  2. Update email credentials in .env
  
  3. Test:
     docker-compose up
     Open: http://localhost:5000/api/health

┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY BEST PRACTICES                           │
└─────────────────────────────────────────────────────────────────────┘

✅ DO:
  • Use User Secrets for local dev
  • Use .env for Docker/production
  • Keep appsettings.json with placeholders only
  • Add .env to .gitignore
  • Share secrets via password manager

❌ DON'T:
  • Commit real passwords to Git
  • Share secrets in chat/email
  • Put secrets in appsettings.json
  • Copy .env to public locations
  • Use weak passwords

┌─────────────────────────────────────────────────────────────────────┐
│                    DOCUMENTATION INDEX                               │
└─────────────────────────────────────────────────────────────────────┘

📄 START HERE:
   └─ SETUP_COMPLETE.md ........... What was done + next steps

📄 COMPREHENSIVE GUIDE:
   └─ SECRETS_MANAGEMENT_GUIDE.md . Complete tutorial with examples

📄 QUICK REFERENCE:
   └─ QUICK_SECRETS_REFERENCE.md .. Command cheat sheet

📄 VISUAL GUIDE:
   └─ SECRETS_FLOW_DIAGRAM.md ..... This file - flowcharts

📄 TEMPLATES:
   └─ PRODUCTION.env.example ...... Production .env template
   └─ ENV_TEMPLATE.txt ............ Alternative template

🔍 Where to look when:
   • "How do I set a secret?" → QUICK_SECRETS_REFERENCE.md
   • "Which file should I use?" → SECRETS_FLOW_DIAGRAM.md (this file)
   • "Detailed explanation?" → SECRETS_MANAGEMENT_GUIDE.md
   • "What changed?" → SETUP_COMPLETE.md

