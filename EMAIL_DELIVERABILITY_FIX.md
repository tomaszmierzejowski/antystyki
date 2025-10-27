# Email Deliverability Fix - Spam Rejection Issue

**Date**: October 26, 2025  
**Issue**: Emails rejected by external providers (WP.pl, etc.) as spam  
**Error**: `554 (#5.3.0) Nie przyjmiemy tej wiadomosci poniewaz jest to spam`

---

## 🚨 Problem Description

### User Report
Verification emails work for Gmail addresses but are rejected by other providers (WP.pl, O2.pl, etc.):

```
554 (#5.3.0) Nie przyjmiemy tej wiadomosci poniewaz jest to spam
We can't accept this message because it is spam
```

### Root Cause

**Sender Authentication Mismatch**:
- **FROM address**: `noreply@antystyki.pl` (your domain)
- **SMTP server**: `smtp.gmail.com` (Google's servers)
- **Authentication**: Gmail account credentials

**Why it's blocked**:
1. Email claims to be from `@antystyki.pl`
2. But it's sent through Gmail's servers
3. DNS records don't authorize Gmail to send for your domain
4. Spam filters see this as domain spoofing/phishing
5. Email gets rejected

**Technical terms**:
- **SPF** (Sender Policy Framework) - Not configured
- **DKIM** (DomainKeys Identified Mail) - Not configured
- **DMARC** (Domain-based Message Authentication) - Not configured

---

## ✅ Solutions (Choose One)

### Option 1: Quick Fix - Use Gmail FROM Address ⚡ (5 minutes)

**Best for**: Immediate fix, testing, small-scale use  
**Deliverability**: ✅ High (Gmail is trusted)  
**Professional**: ⚠️ Medium (shows Gmail address)

#### How It Works
Match the FROM address to the SMTP account:
- **FROM**: Your actual Gmail address
- **SMTP**: Same Gmail account
- **Reply-To**: Can still be `noreply@antystyki.pl`

#### Implementation

**Step 1: Update .env file on production server**

```bash
# SSH to server
ssh your-user@antystyki.pl
cd /path/to/antystics
nano .env
```

**Change these lines**:
```bash
# Before:
EMAIL_FROM_ADDRESS=noreply@antystyki.pl
SMTP_USER=your-email@gmail.com

# After (use SAME email for both):
EMAIL_FROM_ADDRESS=your-email@gmail.com
SMTP_USER=your-email@gmail.com
```

**Step 2: Restart application**
```bash
docker-compose -f docker-compose.production.yml restart app
```

**Step 3: Test**
Register a test account with WP.pl email address.

**✅ Pros:**
- Works immediately
- No DNS configuration needed
- High deliverability (Gmail is trusted)
- Free

**❌ Cons:**
- Less professional (shows Gmail address instead of @antystyki.pl)
- Gmail sending limits (500 emails/day for free accounts)
- Users see Gmail address

---

### Option 2: Proper Solution - Configure DNS Records 🎯 (30 minutes)

**Best for**: Professional setup, moderate volume  
**Deliverability**: ✅✅ Very High  
**Professional**: ✅✅ Very High  

#### How It Works
Configure DNS to authorize Gmail to send on behalf of your domain.

#### Implementation

**Step 1: Add SPF Record**

**Go to your domain registrar** (where you bought antystyki.pl):
- Find DNS settings
- Add new TXT record:

```
Type: TXT
Host: @ (or antystyki.pl)
Value: v=spf1 include:_spf.google.com ~all
TTL: 3600
```

**What this does**: Tells email servers "Gmail is authorized to send emails for antystyki.pl"

**Step 2: Verify SPF Record**

Wait 5-10 minutes, then check:
```bash
# On your computer or server
nslookup -type=TXT antystyki.pl

# Or use online tool:
# https://mxtoolbox.com/spf.aspx
```

Should show: `v=spf1 include:_spf.google.com ~all`

**Step 3: Add DMARC Record (Optional but Recommended)**

Add another TXT record:
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@antystyki.pl
TTL: 3600
```

**Step 4: Test Email Delivery**

Register test accounts with:
- WP.pl address
- O2.pl address
- Outlook/Hotmail address

**✅ Pros:**
- Can use `noreply@antystyki.pl` as FROM address
- Professional appearance
- Better deliverability
- Still uses Gmail SMTP (free)

**❌ Cons:**
- Requires DNS access
- 30 minutes setup time
- Still has Gmail sending limits (500/day)

**DNS Configuration Examples by Registrar:**

<details>
<summary>OVH (ovh.pl)</summary>

1. Login to OVH panel
2. Go to: Domeny → antystyki.pl → Strefa DNS
3. Click "Dodaj wpis"
4. Select "TXT"
5. Subdomena: (leave empty for SPF, or `_dmarc` for DMARC)
6. Wartość: `v=spf1 include:_spf.google.com ~all`
7. Click "Zatwierdź"

</details>

<details>
<summary>home.pl</summary>

1. Login to home.pl panel
2. Go to: Moje usługi → Domeny → antystyki.pl
3. Click "Zarządzaj strefą DNS"
4. Click "Dodaj rekord TXT"
5. Host: @ (for SPF) or _dmarc (for DMARC)
6. Value: `v=spf1 include:_spf.google.com ~all`
7. Save

</details>

<details>
<summary>Cloudflare</summary>

1. Login to Cloudflare
2. Select antystyki.pl domain
3. Go to DNS → Records
4. Click "Add record"
5. Type: TXT
6. Name: @ (for SPF) or _dmarc
7. Content: `v=spf1 include:_spf.google.com ~all`
8. Save

</details>

---

### Option 3: Professional Email Service 🚀 (1 hour setup)

**Best for**: Production, high volume, best deliverability  
**Deliverability**: ✅✅✅ Excellent  
**Professional**: ✅✅✅ Excellent  
**Cost**: Free tier available (10,000-100,000 emails/month)

#### Recommended Services

| Service | Free Tier | Setup Time | Difficulty |
|---------|-----------|------------|------------|
| **SendGrid** | 100 emails/day forever | 30 min | Easy |
| **Mailgun** | 5,000 emails/month (3 months) | 30 min | Easy |
| **AWS SES** | 62,000 emails/month (if using EC2) | 45 min | Medium |
| **Brevo (Sendinblue)** | 300 emails/day forever | 20 min | Easy |

#### Recommended: SendGrid (Best for Poland)

**Why SendGrid:**
- ✅ 100 emails/day free forever
- ✅ Excellent deliverability
- ✅ Easy setup
- ✅ Auto-configures SPF/DKIM
- ✅ Detailed analytics
- ✅ Works well with Polish providers

**Step 1: Create SendGrid Account**

1. Go to https://signup.sendgrid.com/
2. Register with your email
3. Verify email address
4. Complete onboarding questionnaire:
   - Company name: Antystyki
   - Use case: Transactional emails
   - Volume: < 100 emails/day

**Step 2: Create API Key**

1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name: "Antystiki Production"
4. Permissions: "Full Access" or "Mail Send"
5. Copy the API key (save it securely!)

**Step 3: Verify Domain (Optional but Recommended)**

1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender" (easiest) OR
3. "Authenticate Your Domain" (better, requires DNS)

**For domain authentication:**
- SendGrid will provide DNS records (CNAME)
- Add them to your domain DNS
- SendGrid verifies automatically

**Step 4: Update Application Code**

Update `EmailService.cs` to use SendGrid API:

```csharp
// Add NuGet package: SendGrid
// Install-Package SendGrid

using SendGrid;
using SendGrid.Helpers.Mail;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var apiKey = _configuration["SendGrid:ApiKey"];
        var client = new SendGridClient(apiKey);
        
        var from = new EmailAddress(
            _configuration["Email:FromAddress"] ?? "noreply@antystyki.pl",
            _configuration["Email:FromName"] ?? "Antystyki"
        );
        var to = new EmailAddress(toEmail);
        
        var msg = MailHelper.CreateSingleEmail(from, to, subject, 
            plainTextContent: "", // Strip HTML for plain text version
            htmlContent: htmlBody
        );
        
        var response = await client.SendEmailAsync(msg);
        
        if (response.StatusCode != System.Net.HttpStatusCode.OK && 
            response.StatusCode != System.Net.HttpStatusCode.Accepted)
        {
            throw new Exception($"SendGrid error: {response.StatusCode}");
        }
    }
}
```

**Step 5: Update Environment Variables**

```bash
# .env file
SENDGRID_API_KEY=SG.your-api-key-here
EMAIL_FROM_ADDRESS=noreply@antystyki.pl
EMAIL_FROM_NAME=Antystyki
```

**Step 6: Update docker-compose**

```yaml
# docker-compose.production.yml
environment:
  - SendGrid__ApiKey=${SENDGRID_API_KEY}
  - Email__FromAddress=${EMAIL_FROM_ADDRESS}
  - Email__FromName=${EMAIL_FROM_NAME}
```

**✅ Pros:**
- Best deliverability
- 100 emails/day free forever
- Professional sender reputation
- Detailed analytics and tracking
- Automatic bounce/spam handling
- Use @antystyki.pl FROM address

**❌ Cons:**
- Requires code changes
- Account setup required
- More complex than Gmail

---

## 🎯 Recommendation

### For Immediate Fix (Today):
**Use Option 1** - Change FROM address to your Gmail account.

### For Production (This Week):
**Use Option 2** - Add SPF record to DNS (takes 30 minutes).

### For Long-Term (Next Month):
**Use Option 3** - Switch to SendGrid for best results.

---

## 📋 Step-by-Step: Quick Fix (Option 1)

### 1. SSH to Production Server
```bash
ssh your-user@antystyki.pl
cd /path/to/antystics
```

### 2. Edit .env File
```bash
nano .env
```

Find these lines:
```bash
EMAIL_FROM_ADDRESS=noreply@antystyki.pl
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

Change to:
```bash
EMAIL_FROM_ADDRESS=your-email@gmail.com  # ← SAME as SMTP_USER
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

Save and exit (Ctrl+X, Y, Enter)

### 3. Restart Application
```bash
docker-compose -f docker-compose.production.yml restart app
```

### 4. Verify Configuration
```bash
docker exec antystics-app env | grep EMAIL
```

Should show:
```
Email__FromAddress=your-email@gmail.com
Email__SmtpUser=your-email@gmail.com
```

### 5. Test Email Delivery

**Test with WP.pl address:**
1. Go to https://antystyki.pl/register
2. Register with: `testuser@wp.pl`
3. Check if email arrives

**Test with O2.pl address:**
1. Register with: `testuser@o2.pl`
2. Check if email arrives

---

## 🔍 Testing Email Deliverability

### Check Spam Score

Use these tools to test your email configuration:

1. **Mail-Tester** (https://www.mail-tester.com/)
   - Send test email to address shown
   - Get spam score (aim for 10/10)

2. **MXToolbox** (https://mxtoolbox.com/)
   - Check SPF: https://mxtoolbox.com/spf.aspx
   - Check DMARC: https://mxtoolbox.com/dmarc.aspx
   - Check blacklist: https://mxtoolbox.com/blacklists.aspx

3. **Google Postmaster Tools** (https://postmaster.google.com/)
   - Monitor sender reputation
   - Track spam complaints

### Test Different Providers

Send test emails to:
- ✉️ Gmail: `test@gmail.com`
- ✉️ WP.pl: `test@wp.pl`
- ✉️ O2.pl: `test@o2.pl`
- ✉️ Outlook: `test@outlook.com`
- ✉️ Yahoo: `test@yahoo.com`

---

## 🔐 Gmail Sending Limits

If using Gmail SMTP:

| Account Type | Limit |
|--------------|-------|
| Free Gmail | 500 emails/day |
| Google Workspace (paid) | 2,000 emails/day |

**If you exceed limits:**
- Gmail temporarily blocks sending
- Wait 24 hours for limit reset
- Consider switching to SendGrid/Mailgun

---

## 📚 DNS Records Reference

### SPF Record
```
v=spf1 include:_spf.google.com ~all
```
Authorizes Gmail to send for your domain.

### DMARC Record
```
v=DMARC1; p=none; rua=mailto:admin@antystyki.pl
```
Defines policy for failed authentication.

### MX Record (if hosting email on domain)
```
Priority: 1
Host: @
Value: ASPMX.L.GOOGLE.COM
```
Only needed if receiving emails on @antystyki.pl

---

## 🐛 Troubleshooting

### Problem: Still rejected as spam after SPF setup

**Check:**
1. Wait 30-60 minutes for DNS propagation
2. Verify SPF record: `nslookup -type=TXT antystyki.pl`
3. Test with mail-tester.com
4. Check if domain is blacklisted: https://mxtoolbox.com/blacklists.aspx

**Solution:**
- Make sure SPF record is exactly: `v=spf1 include:_spf.google.com ~all`
- Only one SPF record per domain
- Check for typos

---

### Problem: Gmail limits exceeded

**Symptoms:**
```
Daily sending quota exceeded
```

**Solutions:**
1. Wait 24 hours for quota reset
2. Upgrade to Google Workspace ($6/month)
3. Switch to SendGrid (100/day free)

---

### Problem: Emails go to spam folder (not rejected)

**Check:**
1. Email content - avoid spam trigger words
2. Include unsubscribe link (for bulk emails)
3. Verify domain with SPF/DKIM
4. Build sender reputation gradually

---

## ✅ Verification Checklist

After implementing fix:

- [ ] FROM address matches SMTP authentication (Option 1)
  OR
- [ ] SPF record added to DNS (Option 2)
  OR
- [ ] SendGrid configured (Option 3)

- [ ] Application restarted
- [ ] Test email sent to Gmail - ✅ Delivered
- [ ] Test email sent to WP.pl - ✅ Delivered (not spam)
- [ ] Test email sent to O2.pl - ✅ Delivered (not spam)
- [ ] Email verification link works
- [ ] Password reset email works
- [ ] No spam rejections in logs

---

## 📊 Current vs Fixed Configuration

### Before (Broken)
```
FROM: noreply@antystyki.pl
SMTP: smtp.gmail.com
AUTH: your-email@gmail.com
SPF: Not configured
Result: ❌ Rejected as spam
```

### After Option 1 (Quick Fix)
```
FROM: your-email@gmail.com
SMTP: smtp.gmail.com
AUTH: your-email@gmail.com
SPF: Not needed (Gmail authenticated)
Result: ✅ Delivered
```

### After Option 2 (Best with Gmail)
```
FROM: noreply@antystyki.pl
SMTP: smtp.gmail.com
AUTH: your-email@gmail.com
SPF: v=spf1 include:_spf.google.com ~all
Result: ✅ Delivered (professional)
```

### After Option 3 (Best Overall)
```
FROM: noreply@antystyki.pl
SMTP: SendGrid API
AUTH: SendGrid API Key
SPF: Auto-configured by SendGrid
DKIM: Auto-configured by SendGrid
Result: ✅✅✅ Best deliverability
```

---

## 📞 Need Help?

**Polish Email Provider Support:**
- WP.pl: https://pomoc.wp.pl/polityka-antyspamowa
- O2.pl: https://pomoc.o2.pl/

**Email Testing Tools:**
- Mail-Tester: https://www.mail-tester.com/
- MXToolbox: https://mxtoolbox.com/
- SendGrid: https://sendgrid.com/

---

**Recommended Action**: Start with Option 1 (5 minutes), then upgrade to Option 2 or 3 later.

