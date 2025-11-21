# Health Check Documentation - Antystyki

This document defines all health check endpoints, expected responses, and validation procedures for the Antystyki platform.

---

## 🏥 Health Check Endpoints

### 1. Primary Health Check

**Endpoint:** `/health`  
**Method:** `GET`  
**Purpose:** Verify API is running and database is connected

**Expected Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T12:34:56.789Z"
}
```

**Failure Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "error": "Cannot connect to database"
}
```

**Test Command:**
```bash
curl -f https://antystyki.pl/api/health
```

---

### 2. Database Connectivity

**Endpoint:** `/api/categories`  
**Method:** `GET`  
**Purpose:** Verify database queries work

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Polityka",
    "slug": "polityka",
    "color": "#3B82F6"
  },
  // ... more categories
]
```

**Test Command:**
```bash
curl -s https://antystyki.pl/api/categories | jq
```

---

### 3. Frontend Availability

**Endpoint:** `/`  
**Method:** `GET`  
**Purpose:** Verify frontend is being served

**Expected Response:** HTTP 200 with HTML content containing "Antystyki"

**Test Command:**
```bash
curl -s https://antystyki.pl/ | grep -q "Antystyki" && echo "✅ Frontend OK" || echo "❌ Frontend Failed"
```

---

### 4. Static Assets

**Test:** Check if Vite-built assets are accessible

**Test Command:**
```bash
curl -I https://antystyki.pl/assets/index-*.js
# Should return 200 OK
```

---

### 5. SSL/TLS Certificate

**Purpose:** Verify HTTPS is working correctly

**Test Command:**
```bash
echo | openssl s_client -connect antystyki.pl:443 -servername antystyki.pl 2>/dev/null | openssl x509 -noout -dates
```

**Expected Output:**
```
notBefore=Oct 16 00:00:00 2025 GMT
notAfter=Jan 14 23:59:59 2026 GMT
```

---

## 🔍 Comprehensive Health Check Script

Save this as `health-check.sh`:

```bash
#!/bin/bash
# ============================================================================
# Comprehensive Health Check for Antystyki Production
# ============================================================================

set -e

DOMAIN="${1:-antystyki.pl}"
PROTOCOL="https"
BASE_URL="${PROTOCOL}://${DOMAIN}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 Antystyki Health Check - $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to check endpoint
check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "Checking $name... "
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
    
    if [ "$HTTP_STATUS" = "$expected_status" ]; then
        echo "✅ OK (HTTP $HTTP_STATUS)"
        return 0
    else
        echo "❌ FAILED (HTTP $HTTP_STATUS, expected $expected_status)"
        return 1
    fi
}

# Function to check JSON response
check_json_endpoint() {
    local name="$1"
    local url="$2"
    local json_field="$3"
    
    echo -n "Checking $name... "
    
    RESPONSE=$(curl -s --max-time 10 "$url" || echo "error")
    
    if echo "$RESPONSE" | jq -e ".$json_field" > /dev/null 2>&1; then
        echo "✅ OK (JSON valid)"
        return 0
    else
        echo "❌ FAILED (Invalid JSON or missing field: $json_field)"
        return 1
    fi
}

# Initialize counters
PASSED=0
FAILED=0

# ============================================================================
# 1. Frontend Tests
# ============================================================================
echo "📱 Frontend Tests"
echo "─────────────────"

if check_endpoint "Homepage" "$BASE_URL/" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

if check_endpoint "Login Page" "$BASE_URL/login" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

if check_endpoint "Create Page" "$BASE_URL/create" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""

# ============================================================================
# 2. API Health Tests
# ============================================================================
echo "🔌 API Tests"
echo "────────────"

if check_json_endpoint "Health Endpoint" "$BASE_URL/api/health" "status"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if check_json_endpoint "Categories API" "$BASE_URL/api/categories" "[0].name"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""

# ============================================================================
# 3. SSL/Security Tests
# ============================================================================
echo "🔒 Security Tests"
echo "─────────────────"

# Check HTTPS redirect
echo -n "Checking HTTP → HTTPS redirect... "
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}/" || echo "000")
if [ "$HTTP_REDIRECT" = "301" ] || [ "$HTTP_REDIRECT" = "302" ]; then
    echo "✅ OK (HTTP $HTTP_REDIRECT)"
    ((PASSED++))
else
    echo "❌ FAILED (HTTP $HTTP_REDIRECT)"
    ((FAILED++))
fi

# Check security headers
echo -n "Checking security headers... "
HEADERS=$(curl -s -I "$BASE_URL/" || echo "error")

HEADER_CHECKS=0
HEADER_TOTAL=4

echo "$HEADERS" | grep -qi "Strict-Transport-Security" && ((HEADER_CHECKS++))
echo "$HEADERS" | grep -qi "X-Frame-Options" && ((HEADER_CHECKS++))
echo "$HEADERS" | grep -qi "X-Content-Type-Options" && ((HEADER_CHECKS++))
echo "$HEADERS" | grep -qi "X-XSS-Protection" && ((HEADER_CHECKS++))

if [ $HEADER_CHECKS -ge 3 ]; then
    echo "✅ OK ($HEADER_CHECKS/$HEADER_TOTAL headers present)"
    ((PASSED++))
else
    echo "⚠️  PARTIAL ($HEADER_CHECKS/$HEADER_TOTAL headers present)"
    ((FAILED++))
fi

# Check SSL certificate
echo -n "Checking SSL certificate... "
SSL_CHECK=$(echo | openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>/dev/null | grep "Verify return code")
if echo "$SSL_CHECK" | grep -q "0 (ok)"; then
    echo "✅ OK"
    ((PASSED++))
else
    echo "❌ FAILED ($SSL_CHECK)"
    ((FAILED++))
fi

echo ""

# ============================================================================
# 4. Performance Tests
# ============================================================================
echo "⚡ Performance Tests"
echo "────────────────────"

# Check response time
echo -n "Checking API response time... "
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/health")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    echo "✅ OK (${RESPONSE_MS}ms)"
    ((PASSED++))
else
    echo "⚠️  SLOW (${RESPONSE_MS}ms - should be < 1000ms)"
    ((FAILED++))
fi

echo ""

# ============================================================================
# 5. Docker Container Status (if running locally)
# ============================================================================
if command -v docker &> /dev/null && [ "$DOMAIN" = "localhost" ] || [ "$DOMAIN" = "127.0.0.1" ]; then
    echo "🐳 Docker Status"
    echo "────────────────"
    
    echo -n "Checking app container... "
    if docker ps | grep -q "antystics-app"; then
        echo "✅ Running"
        ((PASSED++))
    else
        echo "❌ Not running"
        ((FAILED++))
    fi
    
    echo -n "Checking database container... "
    if docker ps | grep -q "antystics-db"; then
        echo "✅ Running"
        ((PASSED++))
    else
        echo "❌ Not running"
        ((FAILED++))
    fi
    
    echo ""
fi

# ============================================================================
# Summary
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$(echo "scale=1; ($PASSED * 100) / $TOTAL" | bc)

echo "Success Rate: ${SUCCESS_RATE}%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All checks passed! System is healthy."
    exit 0
elif [ $FAILED -le 2 ]; then
    echo "⚠️  Some checks failed. Review and fix issues."
    exit 1
else
    echo "🚨 Multiple checks failed! System may be unhealthy."
    exit 2
fi
```

**Make it executable:**
```bash
chmod +x health-check.sh
```

**Run it:**
```bash
# For production
./health-check.sh antystyki.pl

# For local testing
./health-check.sh localhost
```

---

## 🔄 Automated Monitoring

### UptimeRobot Configuration

1. **Sign up:** https://uptimerobot.com (free tier)

2. **Add monitors:**

   **Monitor 1: Homepage**
   - Type: HTTP(S)
   - URL: https://antystyki.pl
   - Interval: 5 minutes
   - Alert: Email/SMS

   **Monitor 2: API Health**
   - Type: Keyword
   - URL: https://antystyki.pl/api/health
   - Keyword: "healthy"
   - Interval: 5 minutes

   **Monitor 3: Database Connectivity**
   - Type: HTTP(S)
   - URL: https://antystyki.pl/api/categories
   - Interval: 10 minutes

---

## 📊 Expected Response Times

| Endpoint | Target | Warning | Critical |
|----------|--------|---------|----------|
| `/health` | < 100ms | < 500ms | > 1000ms |
| `/api/categories` | < 200ms | < 1000ms | > 2000ms |
| Homepage `/` | < 500ms | < 2000ms | > 5000ms |
| `/api/antistics` | < 500ms | < 2000ms | > 5000ms |

---

## 🚨 Failure Scenarios & Responses

### Scenario 1: Health Check Returns 503

**Possible Causes:**
- Database connection failed
- Backend service crashed
- Environment variables missing

**Response:**
1. Check Docker containers: `docker ps`
2. View logs: `docker-compose logs -f app`
3. Check database: `docker-compose logs -f postgres`
4. Verify `.env` file exists and is complete

---

### Scenario 2: Frontend Returns 404

**Possible Causes:**
- Frontend build failed
- wwwroot not populated
- Nginx misconfiguration

**Response:**
1. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify container: `docker exec -it antystics-app ls /app/wwwroot`
3. Rebuild: `docker-compose build app && docker-compose up -d`

---

### Scenario 3: Slow Response Times

**Possible Causes:**
- High traffic
- Database queries not optimized
- Resource constraints (CPU/memory)

**Response:**
1. Check system resources: `htop`
2. Check database connections: `docker exec -it antystics-db psql -U postgres -c "SELECT * FROM pg_stat_activity;"`
3. Consider scaling (more RAM, CDN for static assets)

---

## 📝 Health Check Logs

All health checks should be logged for monitoring:

```bash
# Create health check log
mkdir -p /var/log/antystyki

# Add to cron
crontab -e

# Run health check every 5 minutes and log results
*/5 * * * * /var/www/antystyki/health-check.sh antystyki.pl >> /var/log/antystyki/health-check.log 2>&1
```

---

## ✅ Go-Live Health Check Checklist

Before marking deployment as successful:

- [ ] `/health` returns 200 with "healthy" status
- [ ] `/api/categories` returns valid JSON array
- [ ] Homepage (`/`) loads and displays content
- [ ] HTTPS is working (green padlock)
- [ ] HTTP redirects to HTTPS
- [ ] Security headers are present
- [ ] SSL certificate is valid
- [ ] Response times are under target thresholds
- [ ] Docker containers are running
- [ ] Database accepts connections
- [ ] Logs show no errors
- [ ] User can register and verify email
- [ ] User can create antistic
- [ ] Admin can moderate content

---

**Last Updated:** 2025-10-16  
**Owner:** DevOps Team  
**Review Frequency:** Monthly

