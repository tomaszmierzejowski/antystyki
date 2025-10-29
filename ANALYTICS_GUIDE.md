# Antystyki Analytics Guide - Google Analytics 4

**Document Version**: 1.0  
**Last Updated**: October 29, 2025  
**Status**: Production Ready  
**Analytics Platform**: Google Analytics 4 (GA4)

---

## 📊 Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Tracked Events Reference](#tracked-events-reference)
4. [Key Metrics & KPIs](#key-metrics--kpis)
5. [GA4 Reports Guide](#ga4-reports-guide)
6. [Custom Reports](#custom-reports)
7. [Testing & Verification](#testing--verification)
8. [GDPR Compliance](#gdpr-compliance)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Features](#advanced-features)

---

## Overview

### What We Track

Antystyki uses **Google Analytics 4** to understand user behavior and improve the platform. We track:

- **Basic Traffic**: Page views, sessions, users, devices
- **User Engagement**: Likes, comments, creates, shares
- **Content Performance**: Which Antistics get most engagement
- **User Journey**: How users navigate through the site
- **Conversion Funnels**: Registration → Verification → First Create

### Why GA4?

- ✅ **Free forever** - No cost for up to 10M events/month
- ✅ **Privacy-focused** - IP anonymization, GDPR compliant
- ✅ **Powerful insights** - Understand user behavior patterns
- ✅ **Event-based** - Flexible tracking of custom interactions
- ✅ **Cross-device** - Track users across devices (with consent)

### Architecture

```
User Action (e.g., clicks "like")
         ↓
React Component calls trackAntisticLike()
         ↓
analytics.ts utility function
         ↓
react-ga4 library
         ↓
Google Analytics 4 servers
         ↓
GA4 Dashboard (you view reports)
```

---

## Setup Instructions

### Step 1: Create GA4 Property (10 minutes)

1. **Visit Google Analytics**:
   - Go to: https://analytics.google.com/
   - Sign in with your Google account

2. **Create Account** (if you don't have one):
   - Click "Start measuring"
   - Account name: `Antystyki`
   - Select data sharing settings (recommended: all)

3. **Create Property**:
   - Property name: `Antystyki Production`
   - Reporting time zone: `Poland (GMT+1)`
   - Currency: `PLN (Polish Zloty)`

4. **Add Data Stream**:
   - Platform: **Web**
   - Website URL: `https://antystyki.pl`
   - Stream name: `Antystyki Website`
   - ✅ Enable "Enhanced measurement" (recommended)

5. **Get Measurement ID**:
   - After creating the stream, you'll see a **Measurement ID**
   - Format: `G-XXXXXXXXXX`
   - **Copy this ID** - you'll need it next

### Step 2: Configure Environment Variable

1. **Open your `.env` file** (in project root)

2. **Add your Measurement ID**:
   ```bash
   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
   Replace `G-XXXXXXXXXX` with your actual Measurement ID

3. **Save the file**

4. **Restart your development server** (if running):
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

### Step 3: Verify Installation

1. **Open your site in a browser**:
   - Production: https://antystyki.pl
   - Development: http://localhost:5173

2. **Accept the cookie consent banner** (if shown)

3. **Open GA4 Realtime Report**:
   - Go to: https://analytics.google.com/
   - Navigate to: **Reports → Realtime**

4. **Check for active users**:
   - You should see **1 active user** (yourself)
   - Page view should show your current page
   - Events should start appearing

5. **Test an event**:
   - Click "like" on an Antistic
   - Wait 10-30 seconds
   - Check GA4 Realtime → Events
   - You should see `antistic_like` event

✅ **If you see events, tracking is working!**

---

## Tracked Events Reference

### Standard GA4 Events

| Event Name | Description | Auto-tracked? |
|-----------|-------------|---------------|
| `page_view` | User views a page | ✅ Yes |
| `session_start` | User starts a session | ✅ Yes |
| `first_visit` | User's first visit ever | ✅ Yes |
| `sign_up` | User completes registration | ✅ Yes |
| `login` | User logs in | ✅ Yes |

### Custom Antystyki Events

#### 1. Antistic Interactions

| Event Name | When Triggered | Parameters | Use Case |
|-----------|----------------|------------|----------|
| `antistic_view` | User views an Antistic card | `antistic_id`, `antistic_title`, `category` | Track which Antistics are most viewed |
| `antistic_like` | User clicks "like" | `antistic_id` | Measure engagement rate |
| `antistic_unlike` | User removes "like" | `antistic_id` | Track like/unlike ratio |
| `antistic_comment` | User posts a comment | `antistic_id`, `comment_length` | Measure comment engagement |
| `antistic_share` | User shares an Antistic | `antistic_id`, `share_method` | Track social sharing |
| `antistic_report` | User reports content | `antistic_id`, `report_reason` | Monitor moderation needs |

#### 2. Content Creation

| Event Name | When Triggered | Parameters | Use Case |
|-----------|----------------|------------|----------|
| `create_form_open` | User opens create page | - | Track creation funnel start |
| `create_form_start` | User begins typing | - | Measure creation intent |
| `template_select` | User selects a template | `template_id` | Understand template popularity |
| `antistic_create` | User publishes Antistic | `category`, `template_used` | Track successful creates |

#### 3. User Journey

| Event Name | When Triggered | Parameters | Use Case |
|-----------|----------------|------------|----------|
| `sign_up` | Registration complete | `method` | Track registrations |
| `login` | User logs in | `method` | Track returning users |
| `logout` | User logs out | - | Understand session length |
| `email_verification` | Email verified | `success` | Track verification funnel |

#### 4. Content Discovery

| Event Name | When Triggered | Parameters | Use Case |
|-----------|----------------|------------|----------|
| `category_filter` | User filters by category | `category` | Understand category preferences |
| `search` | User searches | `search_term`, `results_count` | Improve search functionality |
| `load_more` | User clicks "Load More" | `page` | Track infinite scroll usage |

#### 5. Monetization

| Event Name | When Triggered | Parameters | Use Case |
|-----------|----------------|------------|----------|
| `monetization_interaction` | User interacts with ads/donate button | `monetization_type`, `action` | Track revenue potential |
| `external_link_click` | User clicks external link | `url`, `link_text` | Monitor outbound traffic |

---

## Key Metrics & KPIs

### 1. Traffic Metrics

| Metric | Description | Good Target | Where to Find |
|--------|-------------|-------------|---------------|
| **Users** | Unique visitors | Growing 10%/month | Reports → Acquisition → Overview |
| **Sessions** | Total visits | 1.5x users | Reports → Engagement → Overview |
| **Page Views** | Total pages viewed | 5-10 per session | Reports → Engagement → Pages |
| **Avg Session Duration** | Time spent on site | 3-5 minutes | Reports → Engagement → Overview |
| **Bounce Rate** | % who leave after 1 page | < 50% | Reports → Engagement → Overview |

### 2. Engagement Metrics

| Metric | Description | Good Target | How to Calculate |
|--------|-------------|-------------|------------------|
| **Like Rate** | % of views that get likes | 5-10% | `antistic_like` / `antistic_view` |
| **Comment Rate** | % of views with comments | 1-3% | `antistic_comment` / `antistic_view` |
| **Share Rate** | % of views that are shared | 1-2% | `antistic_share` / `antistic_view` |
| **Creation Rate** | % of users who create | 10-15% | `antistic_create` / `Users` |

### 3. Conversion Funnels

#### Registration Funnel

```
Visit Homepage (100%)
    ↓
Click "Register" (40%)
    ↓
Complete Form (60%)
    ↓
Verify Email (70%)
    ↓
First Login (90%)
```

**Track**: `page_view` (/) → `page_view` (/register) → `sign_up` → `email_verification` → `login`

#### Creation Funnel

```
Visit Homepage (100%)
    ↓
Click "Create" (20%)
    ↓
Start Form (80%)
    ↓
Select Template (95%)
    ↓
Publish (60%)
```

**Track**: `page_view` (/) → `create_form_open` → `create_form_start` → `template_select` → `antistic_create`

### 4. Content Performance

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Most Viewed Antistics** | Top 10 by `antistic_view` | Understand what content resonates |
| **Most Liked Antistics** | Top 10 by `antistic_like` | Identify high-quality content |
| **Most Commented** | Top 10 by `antistic_comment` | Find discussion starters |
| **Category Popularity** | Views by category | Content strategy planning |

---

## GA4 Reports Guide

### Realtime Report

**Path**: Reports → Realtime

**What it shows**:
- Users active right now
- Pages they're viewing
- Events happening live

**Use for**:
- ✅ Testing new features
- ✅ Monitoring site during launch
- ✅ Checking if tracking works
- ✅ Seeing immediate user reactions

### Life Cycle Reports

#### 1. Acquisition Overview

**Path**: Reports → Acquisition → Overview

**What it shows**:
- Where users come from (search, social, direct)
- First-time vs. returning users
- User demographics

**Key insights**:
- Which marketing channels work best
- Geographic distribution of users
- Device breakdown (mobile vs desktop)

#### 2. Engagement Overview

**Path**: Reports → Engagement → Overview

**What it shows**:
- Most viewed pages
- Average engagement time
- Events per session

**Key insights**:
- Which pages keep users engaged
- How long users stay
- What actions they take most

#### 3. Engagement → Events

**Path**: Reports → Engagement → Events

**What it shows**:
- All tracked events
- Event count and unique users
- Event parameters

**Key insights**:
- Which interactions are most popular
- Like/comment rates
- Feature adoption

#### 4. Engagement → Pages and Screens

**Path**: Reports → Engagement → Pages and screens

**What it shows**:
- Page views by URL
- Average time on page
- Exits and entrances

**Key insights**:
- Most popular content
- Which pages cause users to leave
- Entry points to your site

### User Reports

#### Demographics

**Path**: Reports → User → Demographics → Overview

**What it shows**:
- Age groups (if available)
- Gender (if available)
- Interests

**Key insights**:
- Target audience validation
- Content personalization opportunities

#### Tech

**Path**: Reports → User → Tech → Overview

**What it shows**:
- Browser types
- Operating systems
- Screen resolutions
- Device categories

**Key insights**:
- Mobile vs desktop usage
- Browser compatibility priorities
- Screen size optimization needs

---

## Custom Reports

### 1. Antistic Performance Dashboard

**Goal**: Track which Antistics are most popular

**Steps to create**:

1. Go to **Explore** → **Blank**
2. **Dimensions**: Add `Event name`, `Event parameter: antistic_id`
3. **Metrics**: Add `Event count`, `Total users`
4. **Filters**: `Event name` exactly matches `antistic_like` OR `antistic_view` OR `antistic_comment`
5. **Visualization**: Table
6. **Sort by**: Event count (descending)

**Result**: See which Antistic IDs have most engagement

### 2. Category Performance Report

**Goal**: Compare performance across categories

**Steps to create**:

1. Go to **Explore** → **Blank**
2. **Dimensions**: Add `Event parameter: category`
3. **Metrics**: Add `Event count`, `Total users`
4. **Filters**: `Event name` exactly matches `category_filter` OR `antistic_view`
5. **Visualization**: Bar chart
6. **Sort by**: Event count (descending)

**Result**: See which categories are most popular

### 3. User Journey Funnel

**Goal**: Visualize registration → first create funnel

**Steps to create**:

1. Go to **Explore** → **Funnel exploration**
2. **Steps**:
   - Step 1: `page_view` where `page_location` contains `/`
   - Step 2: `page_view` where `page_location` contains `/register`
   - Step 3: `sign_up`
   - Step 4: `email_verification` where `success` = true
   - Step 5: `login`
   - Step 6: `antistic_create`
3. **Visualization**: Funnel
4. **Date range**: Last 30 days

**Result**: See drop-off points in user journey

### 4. Engagement Rate by Device

**Goal**: Compare mobile vs desktop engagement

**Steps to create**:

1. Go to **Explore** → **Blank**
2. **Dimensions**: Add `Device category`
3. **Metrics**: Add `antistic_like` (event count), `antistic_view` (event count)
4. **Calculated metric**: `Like Rate` = `antistic_like` / `antistic_view` * 100
5. **Visualization**: Bar chart

**Result**: See if mobile users engage differently

---

## Testing & Verification

### Local Development Testing

1. **Enable debug mode**:
   ```bash
   # Analytics automatically uses test mode in development
   npm run dev
   ```

2. **Open browser console** (F12)

3. **Look for log messages**:
   ```
   [Analytics] GA4 initialized (development mode)
   [Analytics] Pageview: / Antystyki - Home
   [Analytics] Event: antistic_like { antistic_id: "123" }
   ```

4. **All events log to console** in development (not sent to GA4)

### Production Testing

1. **Visit your production site**:
   ```
   https://antystyki.pl
   ```

2. **Accept cookie consent banner**

3. **Install GA Debugger Extension**:
   - Chrome: https://chrome.google.com/webstore/detail/google-analytics-debugger/
   - Firefox: https://addons.mozilla.org/firefox/addon/google-analytics-debugger/

4. **Open browser console** and enable the debugger

5. **Perform actions** (like, comment, create)

6. **Check console** for GA4 payloads being sent

7. **Verify in GA4 Realtime report**:
   - Should see events within 10-30 seconds

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| No events in Realtime | Cookie consent not given | Accept banner first |
| Events not showing | Invalid Measurement ID | Check `.env` file |
| Events show in console but not GA4 | Test mode enabled | Disable test mode in production |
| Duplicate events | Page rendered twice | Check React StrictMode |

---

## GDPR Compliance

### What We Do

✅ **Consent-based tracking**:
- Show cookie consent banner
- Only track after user accepts
- Store consent in localStorage

✅ **IP Anonymization**:
- Last octets of IP address removed
- User location approximate (city-level)

✅ **Data minimization**:
- Only track necessary data
- No sensitive personal information
- No tracking of comment/post content

✅ **User rights**:
- Users can opt-out anytime
- Clear privacy policy
- Contact email for data requests

### User Control

**How users can opt-out**:

1. **Cookie settings**:
   - Clear browser cookies
   - Block third-party cookies

2. **Browser extension**:
   - Install: https://tools.google.com/dlpage/gaoptout

3. **Privacy policy link**:
   - Always available in footer
   - Clear instructions for opting out

### Data Retention

| Data Type | Retention Period | Configurable? |
|-----------|------------------|---------------|
| User events | 26 months | ✅ Yes (GA4 settings) |
| User properties | Until user deletion | ❌ No |
| Cookies | 26 months | ✅ Yes (change in code) |

**To change retention**:
1. GA4 Admin → Data Settings → Data Retention
2. Select: 14 months / 26 months
3. Save

---

## Troubleshooting

### Events Not Appearing

**Symptom**: No events in GA4 Realtime report

**Checklist**:
- [ ] Measurement ID is correct in `.env`
- [ ] Cookie consent banner was accepted
- [ ] Browser console shows no errors
- [ ] Not using ad blocker (disable temporarily)
- [ ] Waited at least 30 seconds for data to appear

**Debug steps**:
```bash
# 1. Check environment variable
echo $VITE_GA4_MEASUREMENT_ID

# 2. Rebuild frontend (if changed .env)
cd frontend
npm run build

# 3. Check browser console for:
[Analytics] GA4 initialized
[Analytics] Consent granted

# 4. Test with curl (backend health check)
curl https://antystyki.pl/api/health
```

### Duplicate Events

**Symptom**: Same event fires twice

**Cause**: React StrictMode renders components twice in development

**Solution**:
- ✅ **Expected in development** - ignore
- ❌ **If in production** - check for double event listeners

**Verify**:
```typescript
// analytics.ts should have this check:
if (!isInitialized || !hasConsent) {
  return; // Prevents duplicate initialization
}
```

### Cookie Consent Banner Not Showing

**Symptom**: Banner doesn't appear on first visit

**Checklist**:
- [ ] `CookieConsent` component is imported in `App.tsx`
- [ ] No localStorage value for `analytics_consent`
- [ ] CSS is loading correctly

**Debug**:
```javascript
// Open browser console and run:
localStorage.getItem('analytics_consent')
// If it returns 'granted' or 'denied', clear it:
localStorage.removeItem('analytics_consent')
// Refresh page
```

### High Bounce Rate

**Symptom**: Bounce rate > 70%

**Possible causes**:
- Slow page load time
- Confusing navigation
- Low-quality traffic source
- Mobile experience issues

**Solutions**:
- Check Core Web Vitals in GA4
- Test mobile responsiveness
- Review traffic sources (Reports → Acquisition)
- A/B test different layouts

---

## Advanced Features

### 1. User ID Tracking

**What it does**: Track same user across devices

**Implementation**:
```typescript
// Already implemented in analytics.ts
import { setUserId } from '../utils/analytics';

// When user logs in:
setUserId(user.id);

// When user logs out:
setUserId(null);
```

**Benefits**:
- See cross-device journeys
- More accurate user counts
- Better conversion attribution

### 2. Custom Dimensions

**What it does**: Add extra data to events

**Example**:
```typescript
trackAntisticLike(antisticId, {
  user_role: 'premium', // Custom dimension
  days_since_registration: 7, // Custom dimension
});
```

**Setup in GA4**:
1. Admin → Custom Definitions → Custom dimensions
2. Click "Create custom dimension"
3. Dimension name: `user_role`
4. Scope: User
5. Event parameter: `user_role`

### 3. E-commerce Tracking

**When to use**: If you add paid features

**Example**:
```typescript
import ReactGA from 'react-ga4';

ReactGA.event('purchase', {
  transaction_id: 'T12345',
  value: 9.99,
  currency: 'PLN',
  items: [{
    item_id: 'premium_monthly',
    item_name: 'Premium Subscription',
    price: 9.99,
  }],
});
```

### 4. Predictive Metrics

**What it does**: GA4 predicts user behavior using machine learning

**Available after**:
- 1,000+ users with positive events
- 1,000+ users without positive events
- 7 days of data collection

**Metrics**:
- **Purchase probability**: Likelihood user will make a purchase
- **Churn probability**: Likelihood user won't return
- **Revenue prediction**: Expected revenue per user

**Use for**:
- Target high-value users with special content
- Re-engage users likely to churn
- Focus marketing on likely converters

---

## Quick Reference Cheat Sheet

### Common GA4 Paths

| What You Want | Where to Go |
|---------------|-------------|
| **Is tracking working?** | Reports → Realtime |
| **How many users today?** | Reports → Acquisition → Overview |
| **What pages are popular?** | Reports → Engagement → Pages |
| **What events fire most?** | Reports → Engagement → Events |
| **Where do users come from?** | Reports → Acquisition → Traffic acquisition |
| **Mobile vs desktop?** | Reports → User → Tech → Overview |
| **Create custom report** | Explore → Blank |
| **Setup alerts** | Admin → Alerts |
| **Change retention** | Admin → Data Settings → Data Retention |

### Event Tracking Code Examples

```typescript
// Import
import { 
  trackPageView,
  trackAntisticLike,
  trackAntisticCreate,
  trackUserLogin,
} from '../utils/analytics';

// Page view (automatic in App.tsx)
trackPageView('/privacy', 'Privacy Policy');

// Like button
onClick={() => {
  toggleLike();
  trackAntisticLike(antisticId);
}}

// Create Antistic
trackAntisticCreate(category, isTemplateUsed);

// Login
trackUserLogin('email');
```

### Testing Checklist

- [ ] Cookie consent banner shows on first visit
- [ ] Events appear in Realtime report after accepting
- [ ] Page views track on navigation
- [ ] Likes track when clicked
- [ ] Comments track when posted
- [ ] Registration tracked
- [ ] Login tracked
- [ ] Create tracked

---

## Support & Resources

### Official Documentation

- **GA4 Help Center**: https://support.google.com/analytics/
- **GA4 Academy**: https://analytics.google.com/analytics/academy/
- **Developer Docs**: https://developers.google.com/analytics/

### Antystyki Resources

- **Privacy Policy**: https://antystyki.pl/privacy
- **Support Email**: privacy@antystyki.pl
- **Implementation**: See `frontend/src/utils/analytics.ts`

### Useful Tools

- **GA Debugger**: Browser extension for testing
- **Google Tag Assistant**: Verify tag implementation
- **Realtime Report**: Test events immediately
- **DebugView**: GA4's built-in debugger (Admin → DebugView)

---

## Next Steps

### Week 1: Setup & Validation

- [ ] Create GA4 property
- [ ] Add Measurement ID to `.env`
- [ ] Deploy to production
- [ ] Verify events in Realtime report
- [ ] Check Privacy Policy displays correctly

### Week 2-4: Baseline Data Collection

- [ ] Wait for 1,000+ users (required for good insights)
- [ ] Monitor Realtime report daily
- [ ] Check for tracking errors
- [ ] Document any anomalies

### Month 2: Analysis & Optimization

- [ ] Review traffic sources (which marketing works)
- [ ] Identify popular categories
- [ ] Find high-performing Antistics
- [ ] Calculate engagement rates
- [ ] Identify drop-off points in funnels

### Month 3+: Advanced Features

- [ ] Set up custom alerts
- [ ] Create automated reports (email)
- [ ] Implement A/B testing
- [ ] Add predictive audiences
- [ ] Integrate with other tools (if needed)

---

**Questions?** Contact privacy@antystyki.pl

**Last Updated**: October 29, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready

