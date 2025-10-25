# Deployment Guide - Antystics

This guide covers deploying Antystics to Kamatera Cloud or any other hosting provider.

> **📘 For Automated CI/CD Deployment (Recommended):**  
> See **[CI_CD_DEPLOYMENT_GUIDE.md](./CI_CD_DEPLOYMENT_GUIDE.md)** for the complete automated deployment pipeline with GitHub Actions, manual approval gates, health checks, and automatic rollback.

> **🏥 For Health Checks and Monitoring:**  
> See **[HEALTHCHECK.md](./HEALTHCHECK.md)** for comprehensive health check procedures and validation endpoints.

---

## Quick Start Guide

This document provides manual deployment options. For production deployments with zero-downtime updates and automated rollback, use the CI/CD pipeline (see above).

## Prerequisites

- Server with Ubuntu 22.04 LTS (minimum 2GB RAM, 20GB storage)
- Domain name (optional but recommended)
- SMTP credentials for email sending
- PostgreSQL database (or use Docker)
- GitHub account (for CI/CD deployment)

## Option 1: Docker Deployment (Recommended)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/yourusername/antystics.git
cd antystics

# Create environment file
cp frontend/.env.example frontend/.env

# Edit frontend/.env
nano frontend/.env
# Set VITE_API_URL to your domain or server IP
```

### 3. Configure Backend

Edit `backend/Antystics.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=postgres;Database=antystics;Username=postgres;Password=YOUR_SECURE_PASSWORD"
  },
  "Jwt": {
    "Secret": "GENERATE_A_SECURE_SECRET_KEY_MIN_32_CHARS",
    "Issuer": "Antystics",
    "Audience": "AntysticsUsers"
  },
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "SmtpUser": "your-email@gmail.com",
    "SmtpPassword": "your-app-password",
    "FromAddress": "noreply@antystyki.pl",
    "FromName": "Antystyki"
  }
}
```

### 4. Update Docker Compose

Edit `docker-compose.yml` to use secure passwords:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: YOUR_SECURE_PASSWORD
  
  backend:
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=antystics;Username=postgres;Password=YOUR_SECURE_PASSWORD
      - Jwt__Secret=YOUR_SECURE_JWT_SECRET
```

### 5. Deploy

```bash
# Build and start containers
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify services are running
docker-compose ps
```

### 6. Set Up Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install nginx -y

# Create configuration
sudo nano /etc/nginx/sites-available/antystics
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name antystyki.pl www.antystyki.pl;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/antystics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Set Up SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d antystyki.pl -d www.antystyki.pl

# Auto-renewal is set up automatically
sudo certbot renew --dry-run
```

### 8. Firewall Configuration

```bash
# Allow necessary ports
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Option 2: Manual Deployment

### 1. Install .NET 8 Runtime

```bash
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0
```

### 2. Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE antystics;
CREATE USER antysticsuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE antystics TO antysticsuser;
\q
```

### 3. Build and Deploy Backend

```bash
cd backend/Antystics.Api
dotnet publish -c Release -o /var/www/antystics-api

# Create systemd service
sudo nano /etc/systemd/system/antystics-api.service
```

Add:

```ini
[Unit]
Description=Antystics API
After=network.target

[Service]
WorkingDirectory=/var/www/antystics-api
ExecStart=/usr/bin/dotnet /var/www/antystics-api/Antystics.Api.dll
Restart=always
RestartSec=10
SyslogIdentifier=antystics-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

Start the service:

```bash
sudo systemctl start antystics-api
sudo systemctl enable antystics-api
```

### 4. Build and Deploy Frontend

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Build frontend
cd frontend
npm ci
npm run build

# Copy to web server
sudo cp -r dist /var/www/antystics-frontend
```

Configure Nginx to serve the frontend and proxy API requests.

## Maintenance

### Backup Database

```bash
# Create backup script
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/antystics"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec antystics-db pg_dump -U postgres antystics > $BACKUP_DIR/antystics_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "antystics_*.sql" -mtime +7 -delete

echo "Backup completed: antystics_$DATE.sql"
```

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh
```

### Update Application

```bash
cd antystics

# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Monitor Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100
```

### Database Migrations

```bash
# Run new migrations
docker exec -it antystics-backend dotnet ef database update
```

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret (min 32 chars)
- [ ] Use strong database password
- [ ] Enable HTTPS with SSL certificate
- [ ] Configure firewall (UFW)
- [ ] Set up automatic backups
- [ ] Configure SMTP with app password (not account password)
- [ ] Keep system and packages updated
- [ ] Monitor logs regularly
- [ ] Set up fail2ban for SSH protection

## Performance Optimization

### 1. Database Indexing

Indexes are already configured in the DbContext, but monitor query performance:

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### 2. Caching

Add Redis for caching (optional):

```yaml
# Add to docker-compose.yml
redis:
  image: redis:alpine
  ports:
    - "6379:6379"
```

### 3. CDN

For static assets, consider using a CDN like Cloudflare.

## Troubleshooting

### Backend not starting

```bash
# Check logs
docker-compose logs backend

# Check database connection
docker exec -it antystics-backend dotnet ef database update
```

### Frontend not loading

```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check frontend container
docker-compose logs frontend
```

### Database issues

```bash
# Access PostgreSQL
docker exec -it antystics-db psql -U postgres antystics

# Check tables
\dt

# Check connections
SELECT * FROM pg_stat_activity;
```

## Monitoring

### Set Up Monitoring (Optional)

Install monitoring tools:

```bash
# Prometheus + Grafana
docker run -d --name=prometheus -p 9090:9090 prom/prometheus
docker run -d --name=grafana -p 3001:3000 grafana/grafana
```

## Support

For issues:
- Check logs: `docker-compose logs`
- Review documentation: README.md
- Open issue: GitHub Issues

---

**Deployment Date**: [Fill in]
**Deployed By**: [Fill in]
**Server**: [Fill in]



