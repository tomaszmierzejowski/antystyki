# Antystyki Monetization Setup Guide

**Version**: 1.0  
**Date**: October 15, 2025  
**Status**: Ready for Implementation  

---

## 📊 Overview

Antystyki uses an ethical, multi-stream monetization model:

1. **Primary**: Google AdSense (display ads)
2. **Secondary**: Buy Me a Coffee (donations/support)
3. **Future**: Sponsored content (NGOs, educational institutions)

**Estimated Setup Time**: 2-3 hours  
**Revenue Projections**: See `ANTYSTYKI_LAUNCH_GUIDE.md` section 3

---

## 💰 Part 1: Buy Me a Coffee Integration

### Status: ✅ **READY** (Button integrated in Footer)

### Quick Start (5 minutes)

1. **Create Account**
   - Visit: https://www.buymeacoffee.com/
   - Sign up with email or social login
   - Choose username: `antystyki` (or your preferred name)

2. **Get Your Page URL**
   - After signup, you'll get: `https://buymeacoffee.com/antystyki`
   - Copy this URL

3. **Update Frontend** (Already done!)
   - Footer component already has Buy Me a Coffee button
   - Update URL in `frontend/src/components/Footer.tsx`:
     ```tsx
     href="https://buymeacoffee.com/YOUR_USERNAME"
     ```

4. **Customize Your Page**
   - Add profile picture
   - Write bio explaining Antystyki's mission
   - Set supporter benefits (e.g., "Ad-free browsing")

### Features

| Feature | Description | Implementation Status |
|---------|-------------|----------------------|
| **Button in Footer** | Yellow "Wesprzyj nas" button | ✅ Complete |
| **Custom URL** | buymeacoffee.com/antystyki | ⏳ User action required |
| **Thank You Message** | Auto-sent to supporters | 🔵 Configure in BMC dashboard |
| **Membership Tiers** | Optional monthly support | 🔵 Optional (can add later) |

### Ad-Free Toggle (Future Enhancement)

**Planned Implementation** (Month 2):
```tsx
// In User entity (backend)
public bool IsSupporterAdFree { get; set; }

// In frontend components
{!user?.isSupporterAdFree && <AdSenseAd />}
```

**User Flow**:
1. User donates via Buy Me a Coffee
2. Includes email in donation message
3. Admin manually grants ad-free status (or automate via BMC API)
4. User enjoys ad-free experience

---

## 📢 Part 2: Google AdSense Integration

### Status: 🟡 **PENDING** (Requires AdSense account approval)

### Step 1: Apply for Google AdSense (30 minutes)

1. **Eligibility Check**
   - ✅ Original content (user-generated antistics)
   - ✅ Privacy Policy and Terms of Service
   - ✅ Domain ownership (antystyki.pl)
   - ✅ Sufficient content (20-30 antistics recommended)
   - ⚠️ Traffic: Not required for approval, but helpful

2. **Application Process**
   - Visit: https://www.google.com/adsense/start/
   - Click "Get Started"
   - Enter your website URL: `https://antystyki.pl`
   - Select your language: Polish (or English)
   - Choose account type: Individual or Business

3. **Add AdSense Code to Website**
   - AdSense will provide a verification code:
     ```html
     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossorigin="anonymous"></script>
     ```
   - Add to `frontend/index.html` in `<head>` section

4. **Wait for Approval** (1-7 days typically)
   - Google will review your site
   - Check email for approval notification
   - Average approval time: 24-48 hours for quality sites

### Step 2: Create Ad Units (15 minutes)

Once approved:

1. **Log in to AdSense Dashboard**
   - https://www.google.com/adsense/

2. **Create Ad Units**

   **Recommended Ad Placements for Antystyki:**

   | Ad Unit Name | Type | Location | Size | Priority |
   |--------------|------|----------|------|----------|
   | `antystyki-header-banner` | Display | Header (below nav) | Responsive | 🔴 High |
   | `antystyki-in-feed` | In-feed | Between antistics | Native | 🟡 Medium |
   | `antystyki-sidebar` | Display | Right sidebar | 300x600 | 🟢 Low |
   | `antystyki-footer` | Display | Above footer | Responsive | 🟢 Low |

3. **Get Ad Unit Codes**
   - For each ad unit, copy the Ad Slot ID (e.g., `1234567890`)
   - Save these for frontend integration

### Step 3: Configure Environment Variables (5 minutes)

Update `frontend/.env`:

```bash
# Google AdSense Configuration
VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX

# Ad Slot IDs (from AdSense dashboard)
VITE_ADSENSE_HEADER_SLOT=1234567890
VITE_ADSENSE_IN_FEED_SLOT=0987654321
VITE_ADSENSE_SIDEBAR_SLOT=1122334455
```

Replace `XXXXXXXXXXXXXXXX` with your actual Publisher ID.

### Step 4: Add AdSense Script to index.html (2 minutes)

Edit `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Antystyki - Statystyki, które zmuszają do myślenia</title>
    
    <!-- Google AdSense -->
    <script async 
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
            crossorigin="anonymous"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 5: Integrate Ad Components (30 minutes)

**A. Header Banner (High Priority)**

Edit `frontend/src/pages/Home.tsx`:

```tsx
import AdSenseAd from '../components/AdSenseAd';

const Home = () => {
  return (
    <div>
      {/* Header Ad - Top Priority for Revenue */}
      <div className="container mx-auto px-4 py-4">
        <AdSenseAd 
          adSlot={import.meta.env.VITE_ADSENSE_HEADER_SLOT || ''}
          adFormat="horizontal"
          className="mb-6"
        />
      </div>
      
      {/* Rest of Home component */}
    </div>
  );
};
```

**B. In-Feed Ads (Medium Priority)**

Edit `frontend/src/pages/Home.tsx` (in the antistics feed):

```tsx
{antistics.map((antistic, index) => (
  <React.Fragment key={antistic.id}>
    <AntisticCard antistic={antistic} />
    
    {/* Show ad every 5 antistics */}
    {(index + 1) % 5 === 0 && (
      <AdSenseAd 
        adSlot={import.meta.env.VITE_ADSENSE_IN_FEED_SLOT || ''}
        adFormat="fluid"
        className="my-4"
      />
    )}
  </React.Fragment>
))}
```

**C. Sidebar Ad (Optional)**

Create `frontend/src/components/Sidebar.tsx`:

```tsx
import AdSenseAd from './AdSenseAd';

const Sidebar = () => {
  return (
    <aside className="hidden lg:block w-80 space-y-6">
      <AdSenseAd 
        adSlot={import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT || ''}
        adFormat="vertical"
      />
    </aside>
  );
};
```

### Step 6: Test Ads (15 minutes)

1. **Development Testing**
   - Ads won't show in development (localhost)
   - Placeholder "Ad space" will appear instead
   - Verify layout and spacing

2. **Production Testing**
   - Deploy to production
   - Visit your site
   - Verify ads appear (may take 10-20 minutes)
   - **IMPORTANT**: Don't click your own ads! (Risk of ban)

3. **Test Mode** (Optional)
   - Use AdSense test mode in account settings
   - Allows clicking for testing without violations

---

## 🎨 Design Guidelines

### Ad Placement Best Practices

✅ **DO**:
- Place ads in natural content breaks
- Use responsive ad units
- Maintain consistent spacing (16-24px margin)
- Ensure ads don't obstruct content
- Label ads if required by local regulations

❌ **DON'T**:
- Place >3 ads per page (AdSense limit)
- Use deceptive ad placement
- Encourage clicks ("Click here!")
- Place ads in popups or hidden content
- Violate AdSense policies

### Ethical Advertising Commitment

Per Antystyki's mission, we commit to:

1. **Non-Intrusive**: Ads complement, don't obstruct content
2. **Quality Control**: Only display relevant, safe ads
3. **User Choice**: Offer ad-free option for supporters
4. **Transparency**: Clearly mark sponsored content
5. **Privacy**: No tracking beyond AdSense defaults

---

## 📈 Revenue Optimization

### Phase 1: Launch (Month 1-2)

| Metric | Target | Action |
|--------|--------|--------|
| **Page RPM** | $0.50-2.00 | Optimize ad placement |
| **CTR** | 0.5-1.0% | A/B test positions |
| **Fill Rate** | >90% | Use auto ads backup |

### Phase 2: Growth (Month 3-6)

- **A/B Testing**: Test different ad sizes and positions
- **User Feedback**: Survey about ad experience
- **AdSense Auto Ads**: Consider enabling for optimization
- **Direct Partnerships**: Reach out to Polish NGOs for sponsored content

### Revenue Calculator

```
Monthly Users: 5,000
Page Views/User: 10
Total Page Views: 50,000

CPM: $1.50 (Polish market average)
Revenue: 50,000 / 1,000 * $1.50 = $75/month

With 5% supporters ($3 donation average):
Donation Revenue: 5,000 * 0.05 * $3 = $750/month

Total Month 3 Revenue: ~$825
```

---

## 🛡️ Compliance & Policies

### AdSense Policies to Follow

1. **Invalid Click Activity**: Never click own ads
2. **Content Policies**: No prohibited content (hate speech, violence)
3. **Ad Placement**: No deceptive placement
4. **Copyright**: Respect intellectual property
5. **Privacy**: Maintain GDPR-compliant Privacy Policy

### Monitoring

- **AdSense Dashboard**: Check daily for policy violations
- **Revenue Reports**: Track RPM, CTR, earnings
- **Invalid Traffic**: Monitor for bot traffic

---

## 🔧 Troubleshooting

### Common Issues

**1. Ads Not Showing**
- ✅ Check Publisher ID is correct in .env
- ✅ Verify AdSense script is in index.html
- ✅ Wait 10-20 minutes after deployment
- ✅ Check browser console for errors

**2. "Ad space (AdSense not configured)" Showing**
- ⚠️ Expected in development
- ✅ Update VITE_ADSENSE_PUBLISHER_ID in .env
- ✅ Rebuild frontend: `npm run build`

**3. AdSense Application Rejected**
- ⚠️ Ensure 20-30 quality antistics published
- ⚠️ Verify Privacy Policy and Terms are accessible
- ⚠️ Check domain DNS is fully propagated
- ⚠️ Reapply after addressing issues

**4. Low Revenue**
- Increase traffic through marketing
- Optimize ad positions (A/B test)
- Improve content quality (longer sessions = more views)
- Consider AdSense Auto Ads

---

## ✅ Implementation Checklist

### Buy Me a Coffee
- [ ] Create Buy Me a Coffee account
- [ ] Customize profile page
- [ ] Update Footer component URL
- [ ] Test donation flow
- [ ] Set up supporter thank-you message

### Google AdSense
- [ ] Apply for AdSense account
- [ ] Add verification code to index.html
- [ ] Wait for approval (1-7 days)
- [ ] Create ad units in AdSense dashboard
- [ ] Save Publisher ID and Ad Slot IDs
- [ ] Update frontend/.env with AdSense credentials
- [ ] Add AdSense script to index.html <head>
- [ ] Integrate AdSenseAd components in Home.tsx
- [ ] Test in production
- [ ] Monitor performance in AdSense dashboard

### Future Enhancements
- [ ] Implement ad-free toggle for supporters
- [ ] Create sponsored content guidelines
- [ ] Set up monthly revenue tracking
- [ ] Plan A/B tests for ad optimization

---

## 📞 Support & Resources

### Google AdSense
- **Help Center**: https://support.google.com/adsense/
- **Community**: https://support.google.com/adsense/community
- **Policies**: https://support.google.com/adsense/answer/48182

### Buy Me a Coffee
- **Help Center**: https://help.buymeacoffee.com/
- **API Docs**: https://developers.buymeacoffee.com/

### Contact
- **Technical Issues**: contact@antystyki.pl
- **Revenue Questions**: business@antystyki.pl

---

**Status**: Ready for implementation  
**Last Updated**: October 15, 2025  
**Next Review**: After AdSense approval

