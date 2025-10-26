# 🌐 Post-Deployment: Nginx & SSL Setup

## Current Status

✅ Your application is deployed and running!
- Application: Running on `http://localhost:5000` (on server)
- Database: Running on `localhost:5432` (on server)
- Docker: Both containers healthy

❌ Not yet accessible from internet:
- No reverse proxy (Nginx) configured
- No SSL certificate (HTTPS)
- DNS may not be pointed

---

## Architecture Overview

```
Internet
   ↓
DNS (antystyki.pl → Your Server IP)
   ↓
Nginx (Port 80/443)
   ├─ Port 80  → Redirect to HTTPS
   └─ Port 443 → Reverse Proxy to localhost:5000
       ↓
   Docker Container (ASP.NET Core on localhost:5000)
       ↓
   PostgreSQL (localhost:5432)
```

---

## Step 1: Install Nginx

SSH to your server and install Nginx:

```bash
ssh user@your-server-ip

# Update packages
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Check it's running
sudo systemctl status nginx
```

---

## Step 2: Configure Nginx

Your repository already has `nginx.production.conf`. Copy it to the server:

### Option A: Copy from repository
```bash
# Already on server at /var/www/antystyki/nginx.production.conf
# (GitHub Actions transfers it)

sudo cp /var/www/antystyki/nginx.production.conf /etc/nginx/sites-available/antystyki

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/antystyki /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default
```

### Option B: Create manually
```bash
sudo nano /etc/nginx/sites-available/antystyki
```

Paste this configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name antystyki.pl www.antystyki.pl;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name antystyki.pl www.antystyki.pl;
    
    # SSL Configuration (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/antystyki.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/antystyki.pl/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to ASP.NET Core
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Increase upload size for images
    client_max_body_size 10M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/antystyki /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

---

## Step 3: Test Nginx Configuration (Before SSL)

Before getting SSL certificate, test with HTTP first:

### Temporary HTTP-only config:
```bash
sudo nano /etc/nginx/sites-available/antystyki
```

Comment out SSL lines:
```nginx
server {
    listen 80;
    server_name antystyki.pl www.antystyki.pl;
    
    location / {
        proxy_pass http://localhost:5000;
        # ... rest of proxy config
    }
}

# Comment out the HTTPS server block for now
```

Test and reload:
```bash
# Test configuration
sudo nginx -t

# Should see: nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

---

## Step 4: Point DNS to Server

Before getting SSL, your domain must point to your server:

### A Records to create:
```
Type    Name    Value                  TTL
A       @       YOUR_SERVER_IP         300
A       www     YOUR_SERVER_IP         300
```

### Verify DNS:
```bash
# Check if DNS is propagated
dig antystyki.pl +short
# Should return: YOUR_SERVER_IP

nslookup antystyki.pl
# Should show your server IP
```

**Wait 5-15 minutes** for DNS propagation.

---

## Step 5: Test HTTP Access

Once DNS is pointed:

```bash
# From your local machine
curl -I http://antystyki.pl

# Should return HTTP 200 or 301/302
```

Or open in browser: `http://antystyki.pl`

---

## Step 6: Install SSL with Let's Encrypt

### Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL Certificate:
```bash
sudo certbot --nginx -d antystyki.pl -d www.antystyki.pl
```

Follow the prompts:
1. Enter email address
2. Agree to terms
3. Choose to redirect HTTP to HTTPS (option 2)

Certbot will:
- Get SSL certificate
- Update Nginx config automatically
- Set up auto-renewal

### Verify SSL:
```bash
# Check certificate
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run
```

---

## Step 7: Final Nginx Configuration

After Certbot, your Nginx config should look like this:

```bash
sudo cat /etc/nginx/sites-available/antystyki
```

Should include:
```nginx
# SSL added by Certbot
ssl_certificate /etc/letsencrypt/live/antystyki.pl/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/antystyki.pl/privkey.pem;
include /etc/letsencrypt/options-ssl-nginx.conf;
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

---

## Step 8: Verify Everything Works

### 1. Check HTTPS:
```bash
curl -I https://antystyki.pl
# Should return HTTP 200
```

### 2. Test API:
```bash
curl https://antystyki.pl/api/health
# Should return: {"status":"healthy",...}
```

### 3. Test Frontend:
```bash
# Open in browser
https://antystyki.pl
```

### 4. Check Docker:
```bash
docker ps
# Both containers should be "healthy"

docker logs antystics-app --tail 50
```

### 5. Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Step 9: Update Environment Variable

Update your `.env` file with the actual domain:

```bash
cd /var/www/antystyki
nano .env
```

Update:
```bash
FRONTEND_URL=https://antystyki.pl
CORS_ALLOWED_ORIGINS=https://antystyki.pl,https://www.antystyki.pl
VITE_API_URL=https://antystyki.pl/api
```

Restart containers:
```bash
docker-compose -f docker-compose.production.yml restart
```

---

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause:** Nginx can't reach the app

**Fix:**
```bash
# Check app is running
docker ps
curl http://localhost:5000/api/health

# Check Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: SSL Certificate Failed

**Cause:** DNS not propagated or port 80 blocked

**Fix:**
```bash
# Verify DNS
dig antystyki.pl +short

# Check if port 80 is open
sudo netstat -tulpn | grep :80

# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Issue: Connection Refused

**Cause:** Firewall blocking ports

**Fix:**
```bash
# Open ports
sudo ufw allow 'Nginx Full'
sudo ufw reload

# Or manually:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## Security Checklist

After setup, verify:

- [ ] HTTPS working (https://antystyki.pl)
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate valid (check browser)
- [ ] Health endpoint accessible
- [ ] Application loads correctly
- [ ] API calls work
- [ ] Auto-renewal set up (`sudo certbot renew --dry-run`)
- [ ] Firewall configured (only 80, 443, 22 open)
- [ ] Security headers present (X-Frame-Options, etc.)

---

## Monitoring

### Check SSL expiry:
```bash
sudo certbot certificates
```

Certificates auto-renew every 60 days.

### Monitor application:
```bash
# Docker status
docker ps

# Application logs
docker logs antystics-app -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# System resources
docker stats
```

---

## Firewall Configuration

Make sure only necessary ports are open:

```bash
# Check current rules
sudo ufw status

# Recommended setup:
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Next Steps After Nginx/SSL Setup

1. ✅ Application accessible via HTTPS
2. ✅ Test user registration flow
3. ✅ Test email verification
4. ✅ Verify image uploads work
5. ✅ Test all API endpoints
6. ⏭️ Set up monitoring (optional)
7. ⏭️ Configure backups
8. ⏭️ Add Google Analytics (optional)
9. ⏭️ Set up error tracking (optional)

---

## Summary Commands

```bash
# Quick setup (if DNS is ready)
sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y
sudo cp /var/www/antystyki/nginx.production.conf /etc/nginx/sites-available/antystyki
sudo ln -s /etc/nginx/sites-available/antystyki /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d antystyki.pl -d www.antystyki.pl
sudo systemctl restart nginx
```

Test:
```bash
curl https://antystyki.pl/api/health
```

---

## 🎉 When Complete

Your full stack will be live:

```
✅ DNS → Your Server IP
✅ Nginx → Port 80/443
✅ SSL → Let's Encrypt
✅ Reverse Proxy → localhost:5000
✅ Docker → ASP.NET Core + PostgreSQL
✅ Application → Fully accessible
```

**Your site will be live at:** `https://antystyki.pl` 🚀

