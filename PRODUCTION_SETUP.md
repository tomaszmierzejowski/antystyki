# Production Setup Guide - Quick Start

This guide helps you set up Antystics for production deployment in the fastest, safest way possible.

> **🚀 RECOMMENDED: Automated CI/CD Deployment**  
> For production deployments with automated builds, manual approval, health checks, and automatic rollback:  
> **See [CI_CD_DEPLOYMENT_GUIDE.md](./CI_CD_DEPLOYMENT_GUIDE.md)** - Complete GitHub Actions pipeline with zero-downtime deployment.

> **🏥 Health Checks & Monitoring:**  
> See [HEALTHCHECK.md](./HEALTHCHECK.md) for comprehensive monitoring setup and validation procedures.

This document covers manual setup. For automated deployments, use the CI/CD guide above.

---

## 📋 Prerequisites

- [ ] Server with Ubuntu 22.04 LTS (2GB RAM minimum)
- [ ] Domain name purchased and DNS configured
- [ ] Email service account (SendGrid, Gmail App Password, etc.)
- [ ] GitHub account (for CI/CD deployment)
- [ ] 2-3 hours of setup time

---

## 🚀 Step 1: Environment Variables Setup (15 minutes)

### 1.1 Create Backend Environment File

Create `backend/.env`:

```bash
cd backend
cat > .env << 'EOF'
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=antystics
DB_USER=postgres
DB_PASSWORD=REPLACE_WITH_STRONG_PASSWORD_20_CHARS

# JWT Configuration - Generate random 64-char string
JWT_SECRET=REPLACE_WITH_RANDOM_64_CHARACTER_STRING_USE_OPENSSL_OR_PASSWORDGEN
JWT_ISSUER=Antystics
JWT_AUDIENCE=AntysticsUsers

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM_ADDRESS=noreply@antystyki.pl
EMAIL_FROM_NAME=Antystyki

# Storage
STORAGE_LOCAL_PATH=wwwroot/uploads

# Environment
ASPNETCORE_ENVIRONMENT=Production
EOF
```

### 1.2 Create Frontend Environment File

Create `frontend/.env`:

```bash
cd ../frontend
cat > .env << 'EOF'
# Update this to your production domain
VITE_API_URL=https://api.antystyki.pl/api

# For local development, use:
# VITE_API_URL=http://localhost:5000/api
EOF
```

### 1.3 Create Docker Compose Environment File

Create root `.env`:

```bash
cd ..
cat > .env << 'EOF'
# PostgreSQL
POSTGRES_DB=antystics
POSTGRES_USER=postgres
POSTGRES_PASSWORD=REPLACE_WITH_STRONG_PASSWORD

# Backend
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET=REPLACE_WITH_RANDOM_64_CHARACTER_STRING
JWT_ISSUER=Antystics
JWT_AUDIENCE=AntysticsUsers

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM_ADDRESS=noreply@antystyki.pl
EMAIL_FROM_NAME=Antystyki

# Frontend
VITE_API_URL=https://api.antystyki.pl/api
EOF
```

### 1.4 Generate Strong Secrets

Use these commands to generate secure secrets:

```bash
# Generate JWT Secret (64 characters)
openssl rand -base64 48

# Generate Database Password (32 characters)
openssl rand -base64 24

# Or use this online (disconnect from internet first): 
# https://www.random.org/strings/
```

**Replace all `REPLACE_WITH_*` placeholders in your `.env` files!**

---

## 🔒 Step 2: Security Hardening (30 minutes)

### 2.1 Update Backend Security Settings

Edit `backend/Antystics.Api/Program.cs`:

**Line 77:** Enable HTTPS metadata validation:
```csharp
options.RequireHttpsMetadata = true; // Change from false to true
```

**Lines 104-110:** Update CORS for production:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "https://antystyki.pl", 
                "https://www.antystyki.pl",
                "http://localhost:5173"  // Keep for dev
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

### 2.2 Add Security Headers Middleware

Add to `Program.cs` after `var app = builder.Build();`:

```csharp
// Add security headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    
    await next();
});
```

### 2.3 Add Health Check Endpoint

Add before `app.MapControllers();`:

```csharp
// Health check endpoint
app.MapGet("/health", async (ApplicationDbContext db) =>
{
    try
    {
        await db.Database.CanConnectAsync();
        return Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }
    catch (Exception ex)
    {
        return Results.Problem(new { status = "unhealthy", error = ex.Message });
    }
});
```

### 2.4 Update Admin Password

After deployment, immediately:
1. Login as admin (`admin@antystyki.pl` / `Admin123!`)
2. Change password to something strong
3. Store in password manager

---

## 📧 Step 3: Email Service Setup (20 minutes)

### Option A: Gmail (Development/Small Scale)

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Antystics"
   - Copy the 16-character password
3. **Update `.env` files**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  (paste app password)
   EMAIL_FROM_ADDRESS=your-email@gmail.com
   ```

**Limitations**: Gmail limits to 500 emails/day

### Option B: SendGrid (Recommended for Production)

1. **Sign up** at https://sendgrid.com (free tier: 100 emails/day)
2. **Create API Key**:
   - Settings → API Keys → Create API Key
   - Full Access
   - Copy the key
3. **Update `.env` files**:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM_ADDRESS=noreply@antystyki.pl
   ```
4. **Verify sender email** in SendGrid dashboard

### Option C: AWS SES (Best for Scale)

1. Sign up for AWS SES
2. Verify domain
3. Get SMTP credentials
4. Update `.env` accordingly

---

## 🖥️ Step 4: Server Provisioning (30 minutes)

### 4.1 Create Server on Kamatera

1. Login to Kamatera
2. Create new server:
   - OS: Ubuntu 22.04 LTS
   - RAM: 2GB minimum (4GB recommended)
   - Storage: 20GB minimum
   - Location: Closest to your users
3. Note the IP address
4. Configure DNS:
   - `antystyki.pl` → A record → Server IP
   - `www.antystyki.pl` → A record → Server IP
   - `api.antystyki.pl` → A record → Server IP

### 4.2 Initial Server Setup

SSH into your server:

```bash
ssh root@YOUR_SERVER_IP
```

Update system and create user:

```bash
# Update system
apt update && apt upgrade -y

# Create non-root user
adduser antystics
usermod -aG sudo antystics
usermod -aG docker antystics

# Set up SSH key for new user
su - antystics
mkdir ~/.ssh
chmod 700 ~/.ssh
```

### 4.3 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
# SSH back in as antystics user
```

### 4.4 Configure Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Configure rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 🚢 Step 5: Deploy Application (30 minutes)

### 5.1 Clone Repository

```bash
cd /home/antystics
git clone https://github.com/YOUR_USERNAME/antystics.git
cd antystics
```

### 5.2 Create Environment Files

Transfer your `.env` files from local machine to server:

```bash
# On your local machine
scp .env antystics@YOUR_SERVER_IP:/home/antystics/antystics/
scp backend/.env antystics@YOUR_SERVER_IP:/home/antystics/antystics/backend/
scp frontend/.env antystics@YOUR_SERVER_IP:/home/antystics/antystics/frontend/
```

Or create them directly on server using the templates from Step 1.

### 5.3 Build and Start Services

```bash
# Build images
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker-compose -f docker-compose.production.yml logs -f

# Verify all containers are running
docker ps

# Expected containers (per PRD §3.1 Requirement 4 - Production Deployment):
# - antystics-app (ASP.NET + React)
# - antystics-db (PostgreSQL)
# - antystics-loki (central log store)
# - antystics-promtail (log shipper)
# - antystics-grafana (observability UI - bound to localhost)
```

### 5.4 Verify Application

```bash
# Test backend
curl http://localhost:5000/health

# Should return: {"status":"healthy","timestamp":"..."}

# Verify internal Grafana UI (bound to localhost for security)
curl -I http://localhost:3001/login
# Expect HTTP 200 or 302
```

---

## 🌐 Step 6: Nginx Reverse Proxy + SSL (45 minutes)

### 6.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 6.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/antystics
```

Paste this configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name antystyki.pl www.antystyki.pl;
    
    # Allow Certbot for SSL certificate
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main site (Frontend)
server {
    listen 443 ssl http2;
    server_name antystyki.pl www.antystyki.pl;
    
    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/antystyki.pl/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/antystyki.pl/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend (React app)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API endpoints
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for uploads
        client_max_body_size 10M;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files (uploads)
    location /uploads {
        proxy_pass http://127.0.0.1:5000/uploads;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        
        # Cache uploaded images
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

### 6.3 Enable Site and Test Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/antystics /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 6.4 Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d antystyki.pl -d www.antystyki.pl

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Test renewal
sudo certbot renew --dry-run
```

**Certbot will automatically update your Nginx config with SSL certificates!**

---

## ✅ Step 7: Post-Deployment Verification (15 minutes)

### 7.1 Test All Endpoints

```bash
# Health check
curl https://antystyki.pl/api/health

# Categories (should return list)
curl https://antystyki.pl/api/categories
```

### 7.2 Test Frontend

Open browser and visit:
- https://antystyki.pl (should load homepage)
- https://antystyki.pl/login (should load login page)

### 7.3 Test User Flow

1. **Register new account**
   - Go to https://antystyki.pl/register
   - Create account
   - Check email for verification

2. **Login as admin**
   - Email: admin@antystyki.pl
   - Password: Admin123!
   - **IMMEDIATELY CHANGE PASSWORD**

3. **Create test antistic**
   - Click "Stwórz Antystyk"
   - Fill form and submit

4. **Test moderation**
   - Go to admin panel
   - Approve/reject submission

### 7.4 Monitor Logs & Alerts

1. **Forward Grafana port over SSH** (keeps access internal-only per Launch Guide §5):  
   ```bash
   ssh -L 3001:localhost:3001 antystics@YOUR_SERVER_IP
   ```
2. **Login to Grafana** at [http://localhost:3001/login](http://localhost:3001/login) using the credentials from `PRODUCTION.env` (`GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`).
3. Open the dashboard **Logging → Antystyki Logging Overview** to confirm:
   - Error rate panel is populating
   - Failed login panel shows activity when you attempt invalid logins
   - Frontend JS errors appear when you trigger the error boundary (DevTools → run `throw new Error('test')`)
4. Navigate to **Alerting → Alert rules** and confirm rule `Backend error rate > 5/min` is active and points to the default email contact (`tmierzejowski@gmail.com`).
5. (Fallback) Tail raw containers if needed:  
   ```bash
   docker-compose -f docker-compose.production.yml logs -f antystics-app
   docker-compose -f docker-compose.production.yml logs -f antystics-promtail
   ```

---

## 🔄 Step 8: Setup Automated Backups (15 minutes)

### 8.1 Create Backup Script

```bash
sudo nano /usr/local/bin/backup-antystics.sh
```

Paste:

```bash
#!/bin/bash

BACKUP_DIR="/home/antystics/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="antystics-db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec $CONTAINER_NAME pg_dump -U postgres antystics | gzip > "$BACKUP_DIR/antystics_$DATE.sql.gz"

# Backup uploaded files
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /home/antystics/antystics/backend/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "antystics_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

# Log
echo "Backup completed: $DATE" >> /home/antystics/backups/backup.log
```

Make executable:

```bash
sudo chmod +x /usr/local/bin/backup-antystics.sh
```

### 8.2 Schedule Daily Backups

```bash
# Edit crontab
crontab -e

# Add this line (runs at 2 AM daily)
0 2 * * * /usr/local/bin/backup-antystics.sh
```

### 8.3 Test Backup

```bash
sudo /usr/local/bin/backup-antystics.sh

# Verify backup created
ls -lh /home/antystics/backups/
```

---

## 📊 Step 9: Observability & Alerting (20 minutes)

This step fulfils the centralized logging requirement in **PRD §3.1 – Production Deployment** and the launch checklist item “Verify Loki + Grafana logging operational” in **Go-Live §5**.

### 9.1 Confirm Loki Stack is Running

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
# Ensure you see:
# - antystics-loki
# - antystics-promtail
# - antystics-grafana
```

Volumes are created automatically:

```bash
docker volume ls | grep loki
docker volume ls | grep grafana
```

### 9.2 Secure Grafana Access

1. Open `.env` (root) and set:
   ```
   GRAFANA_ADMIN_USER=tmierzejowski@gmail.com
   GRAFANA_ADMIN_PASSWORD=<generate a strong unique password>
   ```
2. Restart only Grafana to pick up changes:
   ```bash
   docker-compose -f docker-compose.production.yml up -d grafana
   ```
3. Keep Grafana bound to `127.0.0.1:3001` (already configured) so only SSH tunnels can reach it, satisfying GDPR and Launch Guide security notes.

### 9.3 Review Dashboards & Alerts

1. Create an SSH tunnel (same as Step 7.4):
   ```bash
   ssh -L 3001:localhost:3001 antystics@YOUR_SERVER_IP
   ```
2. Login at http://localhost:3001/login using the credentials above.
3. Visit **Logging → Antystyki Logging Overview** and confirm all panels show data (error rate, failed logins, API 500s, frontend errors).
4. Go to **Alerting → Contact points** and verify the auto-provisioned receiver `default-email` points to `tmierzejowski@gmail.com`.
5. Go to **Alerting → Alert rules** and ensure rule `Backend error rate > 5/min` is `Active`. Trigger a test (temporarily log multiple errors) if needed.

### 9.4 Optional: Enable Sentry (Self-hosted or SaaS)

1. Deploy a Sentry instance in the EU (or use an EU-hosted SaaS plan).
2. Set the following in `.env`:
   ```
   SENTRY_DSN=https://<key>@<host>/<project>
   SENTRY_ENABLED=true
   SENTRY_ENVIRONMENT=Production
   SENTRY_RELEASE=antystics@1.0.0
   ```
3. Restart the application container:
   ```bash
   docker-compose -f docker-compose.production.yml up -d app
   ```
4. Sentry will now receive unhandled backend exceptions while Loki/Grafana continue to serve as the primary log store.

### 9.5 External Uptime Monitoring (Recommended)

1. Sign up for UptimeRobot or BetterStack.
2. Add monitors for:
   - https://antystyki.pl (homepage)
   - https://antystyki.pl/api/health (API health check)
   - Optional: a custom keyword check for “healthy” response.
3. Point notifications to the same inbox used for Grafana alerts to keep operations centralized.

---

## 🎯 Step 10: Final Security Checklist

- [ ] Changed default admin password
- [ ] All secrets are in `.env` files (not in code)
- [ ] HTTPS is working (green padlock in browser)
- [ ] Firewall is enabled and configured
- [ ] SSH is secured (consider key-only authentication)
- [ ] Backups are running daily
- [ ] Monitoring is active
- [ ] Email service is working
- [ ] All database ports are bound to localhost only
- [ ] `RequireHttpsMetadata` is set to `true`

---

## 🚀 You're Live!

Your MVP is now in production! 🎉

### Next Steps:

1. **Test thoroughly** - Click through every feature
2. **Monitor for 24-48 hours** - Watch logs and uptime
3. **Announce launch** - Share with initial users
4. **Gather feedback** - Iterate based on user input
5. **Plan Phase 2** - Add features from backlog

### Important Commands

```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart services
docker-compose -f docker-compose.production.yml restart

# Stop services
docker-compose -f docker-compose.production.yml down

# Update application
cd /home/antystics/antystics
git pull origin main
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Restore backup
gunzip < backup.sql.gz | docker exec -i antystics-db psql -U postgres antystics
```

---

## 🆘 Troubleshooting

**Backend won't start?**
```bash
docker-compose -f docker-compose.production.yml logs backend
# Check database connection string
# Verify .env file exists
```

**Emails not sending?**
```bash
# Test SMTP connection
docker exec -it antystics-backend dotnet run
# Check Email settings in .env
```

**SSL certificate issues?**
```bash
sudo certbot renew --dry-run
sudo certbot certificates
```

**Need to rollback?**
```bash
git checkout <previous-commit>
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

---

**Estimated Total Setup Time: 3-4 hours**

**Questions?** Check `DEPLOYMENT.md` and `ANTYSTYKI_LAUNCH_GUIDE.md`

Good luck with your launch! 🚀

