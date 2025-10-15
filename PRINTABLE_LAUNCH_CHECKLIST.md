# 📋 Printable Launch Checklist

**Print this page and check off items as you complete them!**

---

## 🔴 CRITICAL - Must Complete Before Launch

### Security Fixes (30 minutes)
- [ ] Remove hardcoded password from `appsettings.json`
- [ ] Generate strong JWT secret (64 chars)
- [ ] Generate strong database password (20+ chars)
- [ ] Create root `.env` file with secrets
- [ ] Create `frontend/.env` file
- [ ] Enable HTTPS in Program.cs (line 77: set to `true`)
- [ ] Update CORS to include production domain
- [ ] Add security headers middleware
- [ ] Change default admin password from `Admin123!`
- [ ] Verify no secrets in git history

### Email Configuration (15 minutes)
- [ ] Choose email provider (Gmail or SendGrid)
- [ ] Create app password / API key
- [ ] Update `.env` with SMTP credentials
- [ ] Test email sending (register test account)
- [ ] Verify email received and links work
- [ ] Check spam folder settings

### Environment Setup (15 minutes)
- [ ] All `.env` files created
- [ ] All secrets generated and stored securely
- [ ] Production environment variables documented
- [ ] `.env` files in `.gitignore` (verify)
- [ ] ENV_TEMPLATE.txt reviewed

**✓ CRITICAL SECTION COMPLETE - Time: ~60 minutes**

---

## 🟡 HIGH PRIORITY - Strongly Recommended

### CAPTCHA Protection (45 minutes)
- [ ] Register site at google.com/recaptcha/admin
- [ ] Get Site Key and Secret Key
- [ ] Install `react-google-recaptcha-v3` package
- [ ] Add RECAPTCHA keys to `.env` files
- [ ] Implement backend verification service
- [ ] Update AuthController registration
- [ ] Update frontend Register page
- [ ] Add GoogleReCaptchaProvider to App
- [ ] Test CAPTCHA works locally
- [ ] Verify in reCAPTCHA admin console

### Server Provisioning (1 hour)
- [ ] Create server account (Kamatera or similar)
- [ ] Provision Ubuntu 22.04 server (2GB RAM min)
- [ ] Note server IP address
- [ ] SSH into server successfully
- [ ] Create non-root user
- [ ] Update system packages
- [ ] Install Docker
- [ ] Install Docker Compose
- [ ] Verify Docker running

### Firewall & Security (15 minutes)
- [ ] Install UFW (if not installed)
- [ ] Allow port 22 (SSH)
- [ ] Allow port 80 (HTTP)
- [ ] Allow port 443 (HTTPS)
- [ ] Deny all other incoming
- [ ] Enable UFW
- [ ] Verify firewall status
- [ ] Test SSH still works

### Application Deployment (1 hour)
- [ ] Clone repository to server
- [ ] Copy `.env` files to server
- [ ] Build Docker images
- [ ] Start containers with `docker-compose up -d`
- [ ] Verify all containers running
- [ ] Check logs for errors
- [ ] Test backend health endpoint
- [ ] Verify database connection

### Nginx & SSL (1 hour)
- [ ] Install Nginx
- [ ] Create site configuration file
- [ ] Enable site
- [ ] Test Nginx configuration
- [ ] Reload Nginx
- [ ] Install Certbot
- [ ] Obtain SSL certificate
- [ ] Verify HTTPS works (green padlock)
- [ ] Test HTTP redirects to HTTPS
- [ ] Verify certificate auto-renewal

### Monitoring & Backups (30 minutes)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Add email alerts
- [ ] Create backup script
- [ ] Schedule daily backups (cron)
- [ ] Test backup creation
- [ ] Test backup restoration
- [ ] Document backup location
- [ ] Configure log rotation

**✓ HIGH PRIORITY SECTION COMPLETE - Time: ~5 hours**

---

## 🟢 MEDIUM PRIORITY - Should Have

### Domain & DNS (30 minutes)
- [ ] Purchase domain name
- [ ] Configure A record for apex domain
- [ ] Configure A record for www subdomain
- [ ] Configure A record for api subdomain (if needed)
- [ ] Verify DNS propagation
- [ ] Test domain resolves to server

### Legal Pages (2 hours)
- [ ] Write Privacy Policy
- [ ] Write Terms of Service
- [ ] Create privacy policy page in frontend
- [ ] Create terms page in frontend
- [ ] Add links in footer
- [ ] Add cookie consent banner (if needed)
- [ ] Review for GDPR compliance

### Testing (2 hours)
- [ ] Test user registration flow
- [ ] Verify email verification works
- [ ] Test login/logout
- [ ] Test password reset
- [ ] Test create antistic
- [ ] Test admin moderation
- [ ] Test approve/reject workflow
- [ ] Test like functionality
- [ ] Test report functionality
- [ ] Test on mobile device
- [ ] Test on different browsers
- [ ] Check all links work
- [ ] Verify images load
- [ ] Test error handling

### Configuration Review (30 minutes)
- [ ] Review all appsettings files
- [ ] Verify production environment variables
- [ ] Check CORS configuration
- [ ] Review JWT settings
- [ ] Check database connection string
- [ ] Verify email configuration
- [ ] Review security headers
- [ ] Check Docker resource limits

**✓ MEDIUM PRIORITY SECTION COMPLETE - Time: ~5 hours**

---

## 🔵 NICE TO HAVE - Optional

### Performance (1 hour)
- [ ] Enable response compression
- [ ] Configure static file caching
- [ ] Set up CDN (Cloudflare)
- [ ] Optimize images
- [ ] Enable database connection pooling
- [ ] Test page load times
- [ ] Run Lighthouse audit

### Advanced Monitoring (1 hour)
- [ ] Set up error tracking (Sentry)
- [ ] Configure application logging
- [ ] Set up log aggregation
- [ ] Create admin dashboard
- [ ] Set up analytics (optional)
- [ ] Configure performance monitoring

### Rate Limiting (30 minutes)
- [ ] Install rate limiting package
- [ ] Configure rate limits for login
- [ ] Configure rate limits for registration
- [ ] Configure rate limits for API
- [ ] Test rate limiting works
- [ ] Document rate limits

### Documentation (30 minutes)
- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document backup/restore procedures
- [ ] Create troubleshooting guide

**✓ NICE TO HAVE SECTION COMPLETE - Time: ~3 hours**

---

## 🚀 PRE-LAUNCH FINAL CHECKS

### Security Audit (15 minutes)
- [ ] No secrets in git repository
- [ ] All passwords are strong (20+ chars)
- [ ] HTTPS is enforced
- [ ] Security headers present
- [ ] CORS properly configured
- [ ] CAPTCHA working
- [ ] Rate limiting active (if implemented)
- [ ] Admin password changed
- [ ] Database not publicly accessible

### Functional Testing (30 minutes)
- [ ] Homepage loads
- [ ] Registration works
- [ ] Email verification works
- [ ] Login works
- [ ] Create antistic works
- [ ] Admin panel accessible
- [ ] Moderation works
- [ ] Like button works
- [ ] Report button works
- [ ] All pages responsive on mobile

### Infrastructure Check (15 minutes)
- [ ] All Docker containers running
- [ ] Database connection healthy
- [ ] Email service working
- [ ] SSL certificate valid
- [ ] DNS resolving correctly
- [ ] Backups scheduled and tested
- [ ] Monitoring showing "up"
- [ ] Logs being written

### Go/No-Go Decision (5 minutes)
- [ ] All CRITICAL items complete
- [ ] All HIGH PRIORITY items complete
- [ ] No critical bugs found
- [ ] Team ready to support users
- [ ] Communication plan ready
- [ ] Rollback plan documented

**✓ READY TO LAUNCH!**

---

## 📊 Summary

### Minimum Launch (Critical Only)
**Items**: 25 critical tasks  
**Time**: ~2 hours  
**Risk**: High (no CAPTCHA, monitoring)

### Safe Launch (Critical + High Priority)
**Items**: 55 critical + high priority tasks  
**Time**: ~6 hours  
**Risk**: Low  
**Recommended**: ✅ YES

### Complete Launch (All Items)
**Items**: 100+ total tasks  
**Time**: ~14 hours  
**Risk**: Minimal  
**Recommended**: If time allows

---

## 🎯 LAUNCH!

### Post-Launch Monitoring (First 48 Hours)

**Hour 1:**
- [ ] Verify site is accessible
- [ ] Monitor error logs
- [ ] Watch for registration spam
- [ ] Check email delivery

**Hours 2-6:**
- [ ] Check logs every hour
- [ ] Monitor server resources
- [ ] Watch for errors
- [ ] Respond to user feedback

**Hours 6-24:**
- [ ] Check logs every 4 hours
- [ ] Monitor uptime status
- [ ] Review user feedback
- [ ] Address any issues

**Hours 24-48:**
- [ ] Check logs twice daily
- [ ] Review analytics
- [ ] Plan iterations
- [ ] Document lessons learned

---

## 📞 Emergency Contacts

**If something breaks:**

1. Check logs: `docker-compose logs -f`
2. Check health: `curl https://antystyki.pl/api/health`
3. Restart: `docker-compose restart`
4. Rollback: Restore from backup
5. Contact: [Your support contact]

---

## ✅ COMPLETION TRACKING

**Date Started**: _______________

**Critical Complete**: _______________ ⬜  
**High Priority Complete**: _______________ ⬜  
**Medium Priority Complete**: _______________ ⬜  
**Nice to Have Complete**: _______________ ⬜  

**Launch Date**: _______________  
**Launch Time**: _______________  

**Launched By**: _______________  
**Verified By**: _______________  

---

## 🎉 CONGRATULATIONS!

**You've launched Antystics MVP to production!**

**Next Steps:**
1. Monitor closely for 48 hours
2. Gather user feedback
3. Plan first iteration
4. Celebrate! 🎉

---

**Print Date**: _______________  
**Version**: 1.0  
**Status**: [ ] Not Started  [ ] In Progress  [ ] Complete

