# Antystyki Product Requirements Document (PRD)

**Version**: 1.1  
**Date**: November 2, 2025  
**Status**: Production MVP + Future Roadmap  
**Product Manager**: [Your Name]  
**Development Team**: [Your Team]  

---

## 1. Product Overview

### 1.1 Mission Statement
**"Antystyki turns real stats into witty gray-area stories that help our community think deeper before they share."**

Antystyki uses intelligent, ironic interpretations of real statistics to reduce social polarization through humor and critical thinking.

### 1.2 Product Vision
To become the leading platform for thought-provoking, statistically-based humor that promotes nuanced thinking and reduces social polarization in Poland and globally.

### 1.3 Target Users

#### Primary Users
- **Demographics**: Ages 18-35, students and young professionals
- **Psychographics**: Digital natives fatigued by online polarization, appreciate irony and wit
- **Behavior**: Distrust easy answers, willing to share meaningful content, participate in community moderation

#### Secondary Users
- **Educators**: Teachers, professors using statistics for educational purposes
- **Researchers**: Think tanks, NGOs needing to communicate data insights
- **Content Creators**: Social media influencers, journalists, communicators

---

## 2. Current Product Status (MVP v1.0)

### 2.1 Completed Features ✅

#### Core Platform
- **User Authentication** (Feature IDs: F01, F10): JWT-based auth with email verification, plus Google OAuth 2.0 social login (auto-registration, unified JWT issuance, provider-linked identities)
- **Content Creation**: Antistics creation with chart generation and templates
- **Moderation System**: Admin approval workflow for all user submissions
- **User Engagement**: Like, report, and basic interaction features
- **Admin Panel**: Full content management and user administration
- **Responsive Design**: Mobile-first approach with Tailwind CSS

#### Technical Infrastructure
- **Backend**: ASP.NET Core 9 Web API
- **Frontend**: React 19 + TypeScript
- **Database**: PostgreSQL with Entity Framework
- **Deployment**: Docker containerization ready
- **Security**: GDPR compliance, basic security headers
- **Email**: Verification system (needs production SMTP)

#### Content Features
- **Template System**: Predefined chart templates for different statistic types
- **Image Upload**: User-generated images with watermarking
- **Category System**: Organized content categorization
- **Source Links**: Required source citations for all statistics

### 2.2 Critical Gaps (MVP v1.0 Launch Blockers)

#### Security & Production Readiness
- Hardcoded secrets in configuration files
- Missing HTTPS enforcement
- No CAPTCHA protection on registration
- Missing rate limiting
- No production environment configuration

#### Monetization
- No ad integration (Google AdSense ready to implement)
- No donation system (Buy Me a Coffee integration needed)
- No premium features or subscription model

#### Content & Community
- No comments system (entity exists, UI missing)
- No user profiles or reputation system
- No community moderation tools
- Limited content discovery features

---

## 3. Product Requirements by Phase

### 3.1 Phase 1: MVP Launch (Current - 2 weeks)

#### Critical Requirements (Must Have)
1. **Security Hardening**
   - Remove all hardcoded secrets
   - Implement HTTPS enforcement
   - Add CAPTCHA protection
   - Configure production environment

2. **Basic Monetization**
   - Google AdSense integration
   - Buy Me a Coffee widget
   - Ad-free toggle for supporters

3. **Legal Compliance**
   - Privacy Policy
   - Terms of Service
   - Cookie consent (GDPR)

4. **Production Deployment**
   - Server provisioning
   - SSL certificate
   - Monitoring and backups
   - Cookieless visitor metrics (daily unique visitor counts via server-side HMAC logs, Feature ID: OPS-VISITOR-LOG)
   - Centralized logging stack (`OPS-LOG-STACK`): Grafana Loki + Promtail + Grafana with 7-day retention, owner-only Grafana access, and email alert when error rate >5/min (aligned with Launch Guide §5)

5. **Statistics Companion Beta**
   - Launch read-only `Statystyki` hub curated by moderators
   - Enable like/dislike ranking and analytics tracking for conversion funnels
   - Provide moderator queue and tooling for approving/importing statistics
   - **[Feature ID: STAT-HOME-TOGGLE]** Surface the `Statystyki` hub as a co-primary home experience alongside `Antystyki`, with a desktop toggle adjacent to the `Dodaj Antytyk` CTA and mobile swipe gestures to switch views
   - **[Feature ID: STAT-FILTER-REFINE]** Replace the horizontal category filter list with a compact filter control (modal, sheet, or similar) and emphasize contextual hashtags or chips within cards to preserve rapid discovery without consuming hero space
   - [x] Cross-platform share actions with canonical slugs, nuanced mission copy, and GA4 telemetry (`share_button_v1`) aligned with §§1.1, 5.1
6. **Website Statistics Dashboard (Feature ID: F11)**
   - Aggregate cookieless visitor metrics and GA4 insights for owner oversight
   - Backend endpoint `/api/admin/statistics/summary` with 15-minute caching window
   - Data sourcing priority: prefer `OPS-VISITOR-LOG` HMAC daily summaries with GA4 fallback for historical gaps
   - Persist cookieless aggregates in Postgres table `visitor_metrics` to survive container restarts and enable longitudinal reporting
   - Frontend admin view `/admin/statistics` restricted to tmierzejowski@gmail.com

#### Success Metrics
- Application uptime >99%
- Zero critical security vulnerabilities
- Email delivery >95%
- First 100 users registered within 2 weeks
- 200+ sessions on Statistics companion hub within first month
- ≥20% of Statistics CTA clicks create or draft an antystyk

### 3.2 Phase 2: Community Building (Months 2-3)

#### High Priority Features
1. **Comments System**
   - Threaded comments on antistics
   - Comment moderation tools
   - User reputation scoring

2. **User Profiles**
   - Public user profiles
   - User statistics and achievements
   - Following system

3. **Enhanced Discovery**
   - Advanced search functionality
   - Trending antistics algorithm
   - Personalized feed based on interests

4. **Community Features**
   - User rankings and leaderboards
   - Content creator badges
   - Community moderation tools

5. **Trust & Credibility Signals**
   - Logged-in users can vote "Trust" or "Fake" on published statistics with rate limits
   - Dynamic trust meter and fake alerts surfaced on Statistics hub and detail views
   - Auto-flag high fake ratios into moderator review workflow

#### Success Metrics
- 1,000+ registered users
- 5,000+ antistics created
- 70%+ approval rate for submissions
- Average session time >3 minutes

### 3.3 Phase 3: Growth & Monetization (Months 4-6)

#### Revenue Features
1. **Premium Subscriptions**
   - Ad-free experience
   - Early access to new features
   - Exclusive content

2. **Sponsored Content**
   - Brand partnerships
   - NGO collaborations
   - Educational institution partnerships

3. **Advanced Analytics**
   - User behavior tracking
   - Content performance metrics
   - Revenue analytics dashboard

4. **Supporter Boosts & Sponsored Statistics**
   - Allow donors to highlight statistics with annotated boost notes
   - Offer clearly labeled sponsored statistics slots for aligned partners
   - Connect boost revenue to premium/supporter tiers

#### International Expansion
1. **Bilingual Support**
   - English language version
   - International content curation
   - Global user base expansion

2. **Localization**
   - Regional statistics focus
   - Cultural adaptation of humor
   - Local moderation teams

#### Success Metrics
- 10,000+ registered users
- $1,000+ monthly revenue
- 50%+ international user base
- Break-even achieved

### 3.4 Phase 4: Platform Evolution (Months 7-12)

#### Advanced Features
1. **Mobile Application**
   - Native iOS/Android apps
   - Push notifications
   - Offline content viewing

2. **AI Integration**
   - Automated content suggestions
   - Smart moderation assistance
   - Personalized content generation

3. **Social Features**
   - Direct messaging between users
   - Group discussions
   - Content collaboration tools

4. **Educational Platform**
   - Statistics education courses
   - Data literacy resources
   - Teacher collaboration tools

#### Success Metrics
- 50,000+ registered users
- $5,000+ monthly revenue
- 1M+ monthly page views
- Platform profitability

---

## 4. Technical Architecture

### 4.1 Current Stack
- **Backend**: ASP.NET Core 9, PostgreSQL, Entity Framework
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Infrastructure**: Docker, Nginx, Kamatera Cloud
- **Observability**: Grafana Loki + Promtail + Grafana (self-hosted, EU-resident, OPS-LOG-STACK)
- **Authentication**: JWT tokens
- **Email**: SMTP integration

### 4.2 Codebase Organization & LLM Context
- **Documentation**: Centralized in `/documentation/` directory.
- **AI Context**: `/llm-context/` contains architectural summaries for AI assistants.
- **Architecture**: 3-Layer (Api, Core, Infrastructure).

### 4.3 Scalability Requirements

#### Performance Targets
- **Response Time**: <200ms for API calls
- **Page Load**: <3 seconds for frontend
- **Concurrent Users**: Support 1,000+ simultaneous users
- **Database**: Handle 1M+ records efficiently

#### Scalability Plan
- **Phase 1**: Single server deployment
- **Phase 2**: Load balancer + multiple app instances
- **Phase 3**: Microservices architecture
- **Phase 4**: Cloud-native deployment with auto-scaling

### 4.3 Security Requirements

#### Data Protection
- **GDPR Compliance**: Full user data control and deletion
- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **Access Control**: Role-based permissions system
- **Audit Logging**: Complete audit trail for all user actions

#### Content Security
- **Moderation**: Multi-layer content filtering
- **Spam Prevention**: CAPTCHA, rate limiting, IP blocking
- **Copyright**: DMCA compliance and content attribution
- **Misinformation**: Source verification and fact-checking integration

---

## 5. User Experience Requirements

### 5.1 Core User Journeys

#### New User Onboarding
1. **Registration**: Simple email/password signup with verification
2. **First Antystyk**: Guided creation with templates
3. **Discovery**: Browse existing content and engage
4. **Contribution**: Submit own content for moderation

#### Content Creation Flow
1. **Template Selection**: Choose from predefined chart types
2. **Data Input**: Enter statistics and source information
3. **Visual Customization**: Select colors, backgrounds, styling
4. **Preview & Submit**: Review before submission to moderation queue

#### Moderation Workflow
1. **Admin Review**: All submissions reviewed by moderators
2. **Approval/Rejection**: Clear feedback to content creators
3. **Publication**: Approved content goes live immediately
4. **Community Reporting**: Users can report inappropriate content

### 5.2 Design Principles

#### Visual Design
- **Minimalist Aesthetic**: Clean, uncluttered interface
- **Gray-Neutral Palette**: Symbolizing "shades of gray" thinking
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance

#### User Experience
- **Intuitive Navigation**: Clear information architecture
- **Fast Loading**: Optimized performance
- **Error Handling**: User-friendly error messages
- **Feedback Systems**: Clear success/error states
- **Home View Toggle**: Mobile-friendly Antystyki/Statystyki switching via swipe gesture and desktop toggle control (`STAT-HOME-TOGGLE`)
- **Compact Filtering**: Context-aware filters surfaced through lightweight controls and in-card hashtags to maintain a minimalist hero area (`STAT-FILTER-REFINE`)

---

## 6. Business Model & Monetization

### 6.1 Revenue Streams

#### Primary Revenue (Phase 1-2)
1. **Display Advertising**
   - Google AdSense integration
   - Ethical, non-intrusive placement
   - Revenue sharing with content creators

2. **Donations**
   - Buy Me a Coffee integration
   - Ad-free experience for supporters
   - Monthly/annual subscription options

#### Secondary Revenue (Phase 3-4)
1. **Premium Subscriptions**
   - Ad-free browsing
   - Early access to features
   - Exclusive content and templates

2. **Sponsored Content**
   - Brand partnerships
   - NGO collaborations
   - Educational institution partnerships

3. **Enterprise Features**
   - Custom branding
   - Advanced analytics
   - API access for organizations

### 6.2 Pricing Strategy

#### Freemium Model
- **Free Tier**: Basic features, ads, community content
- **Premium Tier**: $3/month - Ad-free, early access, exclusive content
- **Enterprise Tier**: $50/month - Custom branding, advanced features

#### Revenue Projections
| Phase | Users | Monthly Revenue | Annual Revenue |
|-------|-------|----------------|----------------|
| Phase 1 | 1K | $50 | $600 |
| Phase 2 | 5K | $300 | $3,600 |
| Phase 3 | 20K | $1,500 | $18,000 |
| Phase 4 | 50K | $5,000 | $60,000 |

---

## 7. Content Strategy & Moderation

### 7.1 Content Guidelines

#### Quality Standards
- **Statistical Accuracy**: All statistics must be verifiable with sources
- **Humor Balance**: Witty but not offensive or controversial
- **Educational Value**: Content should promote critical thinking
- **Originality**: Encourage unique perspectives on data

#### Moderation Principles
- **Transparency**: Clear guidelines and appeal process
- **Consistency**: Uniform application of standards
- **Community Involvement**: User reporting and feedback systems
- **Cultural Sensitivity**: Respect for diverse perspectives

### 7.2 Content Creation Support

#### Templates & Tools
- **Chart Templates**: Pre-designed formats for common statistic types
- **Data Visualization**: Easy-to-use chart generation tools
- **Source Integration**: Built-in citation and verification tools
- **Collaboration**: Tools for multiple users to work on content

#### Creator Incentives
- **Recognition**: Featured creator programs
- **Monetization**: Revenue sharing for popular content
- **Community Status**: Reputation and ranking systems
- **Educational Resources**: Training on statistics and data visualization

---

## 8. Risk Assessment & Mitigation

### 8.1 Technical Risks

#### High Risk
- **Security Breaches**: Regular security audits and updates
- **Server Downtime**: Redundant infrastructure and monitoring
- **Data Loss**: Automated backups and disaster recovery

#### Medium Risk
- **Scalability Issues**: Performance monitoring and optimization
- **Third-party Dependencies**: Vendor diversification and fallbacks
- **Technical Debt**: Regular refactoring and code reviews

### 8.2 Business Risks

#### High Risk
- **Low User Adoption**: Viral marketing and influencer partnerships
- **Content Controversy**: Clear moderation guidelines and community standards
- **Competition**: First-mover advantage and unique positioning

#### Medium Risk
- **Revenue Underperformance**: Multiple revenue streams and flexible pricing
- **Regulatory Changes**: Legal compliance and adaptability
- **Team Scaling**: Clear documentation and knowledge transfer

### 8.3 Mitigation Strategies

#### Proactive Measures
- **Regular Monitoring**: Uptime, performance, and security monitoring
- **Community Building**: Early user engagement and feedback loops
- **Legal Compliance**: Regular legal reviews and updates
- **Financial Planning**: Conservative projections and multiple revenue streams

---

## 9. Success Metrics & KPIs

### 9.1 Product Metrics

#### User Engagement
- **Daily Active Users (DAU)**: Target 30% of registered users
- **Session Duration**: Average >3 minutes
- **Content Creation Rate**: 20% of users create content
- **User Retention**: 40% monthly retention rate
- **Statistics CTA Conversion**: ≥20% of statistics hub sessions trigger an antystyk draft or creation (Phase 1 target)
- **Statistic Vote Participation**: ≥25% of logged-in viewers cast Trust/Fake or Like/Dislike signals once Phase 2 launches

#### Content Quality
- **Approval Rate**: >70% of submissions approved
- **Moderation Time**: <24 hours average review time
- **Source Verification**: 100% of content has verified sources
- **User Satisfaction**: >4.0/5.0 rating
- **Trust Resolution SLA**: <12 hours average to review statistics flagged with high "Fake" ratios

### 9.2 Business Metrics

#### Revenue
- **Monthly Recurring Revenue (MRR)**: Primary growth metric
- **Customer Acquisition Cost (CAC)**: <$5 per user
- **Lifetime Value (LTV)**: >$20 per user
- **Revenue per User**: $0.10-0.50 monthly
- **Supporter Boost Adoption**: ≥10 supporter boosts or sponsored statistics per month by Phase 3

#### Growth
- **User Growth Rate**: 20% month-over-month
- **Content Growth**: 100+ new antistics per month
- **Geographic Expansion**: 50% international users by Phase 3
- **Market Penetration**: 10% of target demographic awareness
- **Statistics Library Depth**: 100 curated statistics live by end of Phase 1, 300 by end of Phase 2

---

## 10. Development Roadmap

### 10.1 Immediate Priorities (Next 2 Weeks)

#### Week 1: Security & Infrastructure
- [ ] Remove hardcoded secrets and implement environment variables
- [ ] Enable HTTPS enforcement and security headers
- [ ] Implement CAPTCHA protection
- [ ] Configure production email service
- [ ] Deploy to production server with SSL
- [ ] Stand up Statistics companion API endpoints with analytics events and admin queue

#### Week 2: Monetization & Launch
- [ ] Integrate Google AdSense
- [ ] Add Buy Me a Coffee widget
- [ ] Create legal pages (Privacy Policy, Terms of Service)
- [ ] Implement monitoring and backups
- [ ] Execute launch marketing campaign
- [ ] Ship React `Statystyki` hub with like/dislike ranking and CTA into antystyk creator

### 10.2 Short-term Roadmap (Months 2-3)

#### Month 2: Community Features
- [ ] Implement comments system
- [ ] Add user profiles and reputation system
- [ ] Create advanced search functionality
- [ ] Launch community moderation tools
- [ ] Activate trust/fake voting signals on Statistics hub with throttle and auto-flag rules

#### Month 3: Enhanced Discovery
- [ ] Implement trending algorithm
- [ ] Add personalized feed
- [ ] Create content creator programs
- [ ] Launch mobile-optimized interface

### 10.3 Medium-term Roadmap (Months 4-6)

#### Months 4-5: Monetization Expansion
- [ ] Launch premium subscription tier
- [ ] Implement sponsored content system
- [ ] Add revenue sharing for creators
- [ ] Create enterprise features
- [ ] Roll out supporter boosts and sponsored statistic placements with moderation safeguards

#### Month 6: International Expansion
- [ ] Launch English language version
- [ ] Implement international content curation
- [ ] Add regional statistics focus
- [ ] Expand to global markets

### 10.4 Long-term Vision (Months 7-12)

#### Platform Evolution
- [ ] Develop native mobile applications
- [ ] Implement AI-powered content suggestions
- [ ] Create educational platform features
- [ ] Launch API for third-party integrations

---

## 11. Resource Requirements

### 11.1 Team Structure

#### Core Team (Current)
- **Product Owner**: Strategic direction and requirements
- **Full-Stack Developer**: Backend and frontend development
- **Content Moderator**: Quality control and community management

#### Expansion Plans
- **Month 3**: Add UI/UX Designer
- **Month 6**: Add Marketing Specialist
- **Month 9**: Add Mobile Developer
- **Month 12**: Add Data Analyst

### 11.2 Budget Requirements

#### Development Costs
- **Year 1**: $50,000 (team salaries and infrastructure)
- **Year 2**: $100,000 (team expansion and marketing)
- **Year 3**: $200,000 (international expansion and mobile development)

#### Infrastructure Costs
- **Hosting**: $10-50/month (scaling with users)
- **Third-party Services**: $100-500/month (email, monitoring, etc.)
- **Marketing**: $1,000-5,000/month (paid advertising and partnerships)

---

## 12. Conclusion

Antystyki represents a unique opportunity to address social polarization through intelligent humor while building a sustainable business model. The product is 95% complete and ready for launch within 2 weeks.

### Key Success Factors
1. **Security First**: Complete hardening before launch
2. **Community Building**: Focus on early user engagement
3. **Content Quality**: Maintain high standards through moderation
4. **Revenue Diversification**: Multiple streams from day one
5. **Iterative Improvement**: Launch fast, learn faster

### Next Steps
1. **Immediate**: Complete security hardening and deploy to production
2. **Week 1**: Launch with basic monetization and legal compliance
3. **Month 1**: Gather user feedback and iterate on core features
4. **Month 3**: Expand community features and premium offerings

The roadmap provides a clear path from MVP to a profitable, scalable platform that serves the mission of reducing social polarization through intelligent, statistically-based humor.

---

**Document Status**: Ready for Development Team  
**Next Review**: Post-Launch (Week 3)  
**Approval Required**: Product Owner, Technical Lead, Business Stakeholder

---

## Changelog
- 2025-11-02: Updated mission statement in §1.1 to emphasize witty, community-driven storytelling grounded in real statistics.
- 2025-11-05: Documented cross-platform sharing milestone in §3.1 and reinforced mission-aligned share guidelines per §§1.1, 5.1.
- 2025-11-05: Added home toggle and compact filtering requirements for Statystyki visibility enhancements (§3.1, §5.2).
- 2025-11-09: Added Feature F10 Social Login requirements and status (Google OAuth) including provider-linked identities and GDPR-compliant consent messaging; deferred Facebook integration until business registration is available.
- 2025-11-12T10:30Z: Clarified Feature F11 data sourcing to prioritize OPS-VISITOR-LOG cookieless summaries with GA4 fallback (§3.1).
- 2025-11-12T17:55Z: Required persistence of cookieless visitor aggregates in Postgres (`visitor_metrics`) to ensure statistics survive container restarts (§3.1).
- 2025-11-21: Repository restructuring for LLM optimization. Added `/llm-context/` for AI assistants and consolidated documentation into `/documentation/`.
