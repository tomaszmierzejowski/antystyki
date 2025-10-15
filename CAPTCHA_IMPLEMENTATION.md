# CAPTCHA Implementation Guide

This guide shows you how to add Google reCAPTCHA v3 to protect the registration endpoint from bots.

## 🎯 Why CAPTCHA?

Currently, there are TODOs in the code:
- `backend/Antystics.Api/Controllers/AuthController.cs` line 38: `// TODO: Validate CAPTCHA token`
- `frontend/src/pages/Register.tsx` line 33: `captchaToken: 'dummy' // TODO: Implement real CAPTCHA`

Without CAPTCHA, bots can spam your registration endpoint.

---

## 📋 Prerequisites

- Google Account
- 10 minutes of time

---

## Step 1: Get reCAPTCHA Keys (5 minutes)

### 1.1 Register Your Site

1. Go to https://www.google.com/recaptcha/admin/create
2. Log in with Google account
3. Fill in the form:
   - **Label**: `Antystics Production`
   - **reCAPTCHA type**: Select **reCAPTCHA v3**
   - **Domains**: 
     - `antystyki.pl`
     - `localhost` (for development)
   - Accept the terms
   - Click **Submit**

### 1.2 Copy Your Keys

You'll get two keys:
- **Site Key** (public, goes in frontend)
- **Secret Key** (private, goes in backend)

Example:
```
Site Key: 6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Secret Key: 6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Step 2: Backend Implementation (20 minutes)

### 2.1 Install NuGet Package

```bash
cd backend/Antystics.Api
dotnet add package reCAPTCHA.AspNetCore
```

### 2.2 Update Configuration

**File:** `backend/Antystics.Api/appsettings.json`

Add:
```json
{
  "RecaptchaSettings": {
    "SecretKey": "your-secret-key-here",
    "SiteKey": "your-site-key-here",
    "Version": "v3",
    "MinScore": 0.5
  }
}
```

**File:** `backend/Antystics.Api/appsettings.Production.json`

```json
{
  "RecaptchaSettings": {
    "SecretKey": "USE_ENV_VARIABLE",
    "SiteKey": "6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

**File:** Root `.env`

Add:
```
RECAPTCHA_SECRET_KEY=your-secret-key-from-google
RECAPTCHA_SITE_KEY=your-site-key-from-google
```

### 2.3 Create CAPTCHA Service

**File:** `backend/Antystics.Core/Interfaces/IRecaptchaService.cs`

```csharp
namespace Antystics.Core.Interfaces;

public interface IRecaptchaService
{
    Task<bool> VerifyTokenAsync(string token, string action, string remoteIp);
}
```

**File:** `backend/Antystics.Infrastructure/Services/RecaptchaService.cs`

```csharp
using System.Text.Json;
using Antystics.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Antystics.Infrastructure.Services;

public class RecaptchaService : IRecaptchaService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RecaptchaService> _logger;
    private const string VerifyUrl = "https://www.google.com/recaptcha/api/siteverify";

    public RecaptchaService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<RecaptchaService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> VerifyTokenAsync(string token, string action, string remoteIp)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("CAPTCHA token is null or empty");
            return false;
        }

        var secretKey = _configuration["RecaptchaSettings:SecretKey"];
        var minScore = double.Parse(_configuration["RecaptchaSettings:MinScore"] ?? "0.5");

        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            { "secret", secretKey },
            { "response", token },
            { "remoteip", remoteIp }
        });

        try
        {
            var response = await _httpClient.PostAsync(VerifyUrl, content);
            var jsonString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<RecaptchaResponse>(jsonString);

            if (!result.Success)
            {
                _logger.LogWarning("reCAPTCHA verification failed: {Errors}", 
                    string.Join(", ", result.ErrorCodes ?? Array.Empty<string>()));
                return false;
            }

            if (result.Action != action)
            {
                _logger.LogWarning("reCAPTCHA action mismatch. Expected: {Expected}, Got: {Actual}", 
                    action, result.Action);
                return false;
            }

            if (result.Score < minScore)
            {
                _logger.LogWarning("reCAPTCHA score too low: {Score} (minimum: {MinScore})", 
                    result.Score, minScore);
                return false;
            }

            _logger.LogInformation("reCAPTCHA verification successful. Score: {Score}", result.Score);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying reCAPTCHA token");
            return false;
        }
    }

    private class RecaptchaResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("success")]
        public bool Success { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("score")]
        public double Score { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("action")]
        public string Action { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("challenge_ts")]
        public DateTime ChallengeTimestamp { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("hostname")]
        public string Hostname { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("error-codes")]
        public string[] ErrorCodes { get; set; }
    }
}
```

### 2.4 Register Service in Program.cs

**File:** `backend/Antystics.Api/Program.cs`

Add after line 98 (after other service registrations):

```csharp
// Register reCAPTCHA service
builder.Services.AddHttpClient<IRecaptchaService, RecaptchaService>();
```

### 2.5 Update AuthController

**File:** `backend/Antystics.Api/Controllers/AuthController.cs`

Add constructor parameter:

```csharp
private readonly IRecaptchaService _recaptchaService;

public AuthController(
    UserManager<User> userManager, 
    ITokenService tokenService, 
    IEmailService emailService,
    ApplicationDbContext context,
    IRecaptchaService recaptchaService)
{
    _userManager = userManager;
    _tokenService = tokenService;
    _emailService = emailService;
    _context = context;
    _recaptchaService = recaptchaService;
}
```

Update the Register method (replace the TODO at line 38):

```csharp
[HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegisterRequest request)
{
    // Validate CAPTCHA token
    var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    var isValidCaptcha = await _recaptchaService.VerifyTokenAsync(
        request.CaptchaToken, 
        "register", 
        remoteIp
    );

    if (!isValidCaptcha)
    {
        return BadRequest(new { message = "CAPTCHA verification failed. Please try again." });
    }

    // Check if user already exists
    if (await _userManager.FindByEmailAsync(request.Email) != null)
    {
        return BadRequest(new { message = "User already exists" });
    }

    // Rest of registration logic...
}
```

---

## Step 3: Frontend Implementation (15 minutes)

### 3.1 Install React Package

```bash
cd frontend
npm install react-google-recaptcha-v3
```

### 3.2 Add Site Key to Environment

**File:** `frontend/.env`

Add:
```
VITE_RECAPTCHA_SITE_KEY=your-site-key-from-google
```

### 3.3 Update Register Page

**File:** `frontend/src/pages/Register.tsx`

Import the hook at the top:

```typescript
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
```

Update the Register component:

```typescript
export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Get reCAPTCHA token
      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA not loaded');
      }

      const captchaToken = await executeRecaptcha('register');

      const response = await api.post('/auth/register', {
        ...formData,
        captchaToken, // Replace the dummy token
      });

      setSuccess('Registration successful! Please check your email to verify your account.');
      setFormData({ username: '', email: '', password: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Rest of component...
}
```

### 3.4 Add Provider to App

**File:** `frontend/src/main.tsx`

Import the provider:

```typescript
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
```

Wrap your app:

```typescript
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleReCaptchaProvider>
  </StrictMode>,
);
```

---

## Step 4: Testing (10 minutes)

### 4.1 Test in Development

1. Start backend: `cd backend/Antystics.Api && dotnet run`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173/register
4. Fill out registration form
5. Submit and check:
   - Backend logs show "reCAPTCHA verification successful"
   - Email is sent
   - No errors in browser console

### 4.2 Check reCAPTCHA Admin

1. Go to https://www.google.com/recaptcha/admin
2. Click on your site
3. View analytics - you should see requests coming in

### 4.3 Test Different Scenarios

**Valid submission:**
- Fill form normally → Should work

**Bot behavior:**
- Rapidly submit multiple times → Should get blocked (low score)

**Missing token:**
- Remove `captchaToken` from request → Should get error

---

## Step 5: Production Configuration (5 minutes)

### 5.1 Update Environment Variables

**Production `.env`:**
```
RECAPTCHA_SECRET_KEY=your-production-secret-key
RECAPTCHA_SITE_KEY=your-production-site-key
```

### 5.2 Update reCAPTCHA Settings

In Google reCAPTCHA admin:
1. Edit your site
2. Add production domain: `antystyki.pl`
3. Save

### 5.3 Build and Deploy

```bash
# Frontend build will include the site key
cd frontend
npm run build

# Deploy as usual
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔧 Configuration Options

### Adjust Security Level

**File:** `backend/Antystics.Api/appsettings.json`

```json
{
  "RecaptchaSettings": {
    "MinScore": 0.5  // Range: 0.0 (bot) to 1.0 (human)
  }
}
```

Recommendations:
- **0.3-0.4**: Very lenient (catches obvious bots only)
- **0.5**: Balanced (default, recommended for most sites)
- **0.7-0.8**: Strict (may block some real users)

### Development Mode (Skip CAPTCHA)

For development, you can skip CAPTCHA verification:

```csharp
// In RecaptchaService.VerifyTokenAsync
if (builder.Environment.IsDevelopment() && token == "dev-bypass")
{
    return true;
}
```

Then in frontend development:
```typescript
const captchaToken = process.env.NODE_ENV === 'development' 
  ? 'dev-bypass' 
  : await executeRecaptcha('register');
```

---

## 🐛 Troubleshooting

### "reCAPTCHA not loaded" Error

**Problem:** useGoogleReCaptcha returns null

**Solutions:**
1. Check `VITE_RECAPTCHA_SITE_KEY` is set
2. Verify provider wraps your app
3. Check browser console for loading errors
4. Ensure site key is correct

### "CAPTCHA verification failed" Error

**Problem:** Backend rejects token

**Solutions:**
1. Check secret key is correct
2. Verify action matches ("register")
3. Check score threshold (try lowering MinScore)
4. Ensure domain is whitelisted in Google admin
5. Check backend logs for specific error

### Low Scores in Production

**Problem:** Real users getting blocked

**Solutions:**
1. Lower MinScore to 0.3-0.4
2. Check if using VPN (lowers score)
3. Verify domain is correct in reCAPTCHA admin
4. Test from different devices/networks

---

## 📊 Monitoring

### Check reCAPTCHA Analytics

https://www.google.com/recaptcha/admin

- Request volume
- Score distribution
- Suspicious traffic

### Log CAPTCHA Failures

Backend already logs:
- Verification failures
- Score information
- Action mismatches

Check logs:
```bash
docker-compose logs backend | grep reCAPTCHA
```

---

## ✅ Checklist

- [ ] Registered site with Google reCAPTCHA
- [ ] Copied site key and secret key
- [ ] Installed backend NuGet package
- [ ] Created RecaptchaService
- [ ] Registered service in Program.cs
- [ ] Updated AuthController
- [ ] Installed frontend npm package
- [ ] Added environment variable
- [ ] Updated Register page
- [ ] Added provider to App
- [ ] Tested registration works
- [ ] Checked reCAPTCHA admin shows requests
- [ ] Updated production environment
- [ ] Deployed to production
- [ ] Tested in production

---

## 🎯 Next Steps

After implementing CAPTCHA:
1. Monitor for false positives (real users blocked)
2. Adjust MinScore if needed
3. Consider adding CAPTCHA to:
   - Login (after X failed attempts)
   - Password reset
   - Contact forms
   - Any public submission forms

---

**Estimated Time:** 45 minutes total
**Difficulty:** Easy
**Priority:** High (prevents bot spam)

Good luck! 🤖🚫

