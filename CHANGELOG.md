# Changelog

All notable changes to the Antystics project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed (2025-10-27) - UI Improvements & Anonymous User Features

#### Privacy Policy Dark Mode Fix
- **[BUG FIX]** Fixed low contrast text on Privacy Policy page in mobile dark mode
- **[UX]** Added explicit text color classes for headings, paragraphs, and links in dark mode
- **[ACCESSIBILITY]** Improved readability with proper contrast ratios (blue on blue → blue on gray)
- **[STYLING]** Enhanced prose styling with proper dark mode link colors (blue-400 in dark mode)

#### Anonymous User Like Functionality
- **[FEATURE]** Enabled liking for anonymous (non-logged-in) users
- **[TRACKING]** Implemented localStorage-based duplicate prevention for anonymous likes
- **[SECURITY]** Generate unique anonymous user ID per browser/device
- **[API]** Updated backend to accept anonymous likes via `X-Anonymous-User-Id` header
- **[BACKEND]** Removed `[Authorize]` attribute from like/unlike endpoints
- **[UX]** Anonymous likes tracked client-side to prevent UI duplicates
- **[UX]** Silent failure for anonymous users (no error alerts)
- **[ENGAGEMENT]** Significantly improved user engagement by removing login barrier

#### Brand Identity Update
- **[DESIGN]** Simple, clean logo design with circular gradient background
- **[COMPONENT]** Created reusable `Logo` component with SVG implementation
- **[BRANDING]** Gray gradient circle (gray-400 to gray-600) represents "shades of gray"
- **[BRANDING]** Large white (#FFFFFF) "A" letter centered on circle for maximum contrast
- **[DESIGN]** Clean, minimal design for better readability and performance
- **[UX]** Logo size 48px in navbar for excellent visibility
- **[UX]** Logo size 32px in footer for consistency
- **[NAVBAR]** Updated Navbar to use new Logo component
- **[FOOTER]** Updated Footer to use Logo component instead of empty circle
- **[FAVICON]** Created and added favicon.svg matching logo design
- **[FAVICON]** Simple SVG ensures fast loading and crisp display
- **[SCALABILITY]** SVG format scales perfectly at all sizes

#### Technical Improvements
- **[CODE QUALITY]** Refactored useLike hook with better anonymous user support
- **[CODE QUALITY]** Added useEffect to check localStorage for anonymous likes on mount
- **[BACKEND]** Enhanced like/unlike endpoints to handle both authenticated and anonymous users
- **[BACKEND]** Maintained database integrity - only authenticated likes stored in DB
- **[API]** Anonymous likes increment/decrement counter without DB records (prevents bloat)

### Fixed (2025-10-26) - Production CSP, Email Configuration & Deliverability

#### Email Deliverability & Spam Prevention
- **[CRITICAL BUG]** Fixed emails rejected as spam by external providers (WP.pl, O2.pl, etc.)
- **[SECURITY]** Identified sender authentication mismatch (FROM vs SMTP mismatch)
- **[DOCUMENTATION]** Created EMAIL_DELIVERABILITY_FIX.md with 3 solution options
- **[CONFIGURATION]** Updated PRODUCTION.env.example with proper email configuration
- **[BEST PRACTICE]** Documented SPF/DKIM/DMARC DNS records for domain authentication
- **[RECOMMENDATION]** Quick fix: Match EMAIL_FROM_ADDRESS to SMTP_USER (Gmail)
- **[RECOMMENDATION]** Production fix: Add SPF record to DNS
- **[RECOMMENDATION]** Long-term fix: Switch to SendGrid for best deliverability
- **[DOCUMENTATION]** Added Gmail sending limits documentation (500/day)

#### Content Security Policy (CSP) Fixes
- **[SECURITY]** Updated CSP to allow Google Fonts (fonts.googleapis.com stylesheet)
- **[SECURITY]** Added `font-src` directive to allow Google Fonts files (fonts.gstatic.com)
- **[SECURITY]** Added explicit `connect-src 'self'` to allow same-origin API calls
- **[BUG FIX]** Fixed "Refused to load stylesheet" errors for Google Fonts in production
- **[BUG FIX]** Fixed "Refused to connect" errors for API calls in production
- **[UX]** Inter font family now loads correctly on production site

#### API Configuration Fixes
- **[BUG FIX]** Fixed frontend API calls to use relative URLs (`/api`) in production
- **[ARCHITECTURE]** Production build automatically uses relative paths (nginx proxy)
- **[DEVELOPMENT]** Development mode still uses `VITE_API_URL` environment variable
- **[BUG FIX]** Fixed "Error fetching categories" and "Error fetching antistics" in production

#### Email Verification Link Configuration
- **[BUG FIX]** Diagnosed malformed email verification links (`http:///verify-email`)
- **[DOCUMENTATION]** Created comprehensive guide for FRONTEND_URL configuration
- **[TOOLING]** Added `verify-env.ps1` and `verify-env.sh` scripts to check environment variables
- **[DOCUMENTATION]** Created EMAIL_VERIFICATION_FIX.md with troubleshooting steps
- **[SECURITY]** Documented importance of HTTPS for production FRONTEND_URL

#### Documentation
- **[DOCS]** Created CSP_FIX_DEPLOYMENT.md with deployment guide
- **[DOCS]** Updated PRODUCTION.env.example with better API URL documentation
- **[DOCS]** Added environment variable verification scripts

### Fixed (2025-10-25) - Email Verification, Registration, Role-Based Access & Contact Form

#### Contact Form
- **[FEATURE]** Added complete contact form page at `/contact`
- **[API]** Added `/api/contact` endpoint to send contact form submissions
- **[EMAIL]** Contact form emails sent to `antystyki@gmail.com`
- **[UX]** Beautiful contact form with validation and success messages
- **[UX]** Contact information sidebar with email, response time, and helpful tips
- **[UX]** Updated Footer "Kontakt" link to navigate to contact page instead of mailto link
- **[NAVIGATION]** Added `/contact` route to App.tsx

### Fixed (2025-10-25) - Email Verification, Registration & Role-Based Access Control

#### Role-Based Access Control
- **[SECURITY]** Admin role assigned to `admin@antystyki.pl` during registration
- **[SECURITY]** Moderator role assigned to `tmierzejowski@gmail.com` during registration
- **[SECURITY]** All other users assigned User role by default
- **[ACCESS CONTROL]** Admin Panel restricted to Admin and Moderator roles only
- **[ACCESS CONTROL]** Hide/Delete buttons on main page visible to Admin and Moderator roles
- **[ACCESS CONTROL]** Approve/Reject functionality in Admin Panel accessible to Admin and Moderator
- **[UX]** "Moderacja" link in navbar visible only to Admin and Moderator roles
- **[BUG FIX]** Fixed hide/delete card not refreshing automatically - cards now update immediately after admin action
- **[UX]** Prevent multiple hide clicks on same card - list refreshes after each action

#### Email Verification & Registration Flow Improvements

#### Critical Fixes
- **[CRITICAL BUG]** Fixed invisible submit buttons on Login and Register pages
- **[THEME]** Added primary color scale to Tailwind v4 @theme configuration
- **[UX]** Submit buttons now visible with orange accent color (#E55F00)
- **[CRITICAL BUG]** Fixed "Invalid or expired verification token" error caused by unencoded special characters
- **[API]** Email verification tokens now properly URL-encoded before being placed in links
- **[SECURITY]** Tokens with `+`, `/`, `=` characters now handled correctly in URLs

#### Email Verification & Registration
- **[UX]** Email verification error message now persists on login page (previously disappeared after <1 second)
- **[FEATURE]** Added "Resend Verification Email" button on login page when email is unverified
- **[API]** Added `/api/auth/resend-verification-email` endpoint with token invalidation logic
- **[SECURITY]** Resend endpoint properly invalidates old tokens before generating new ones
- **[UX]** Success/error feedback for resend operation with visual distinction (green/red alerts)
- **[BUG FIX]** Fixed verification email links - now point to frontend URL instead of backend API URL
- **[FEATURE]** Added `/verify-email` route and `VerifyEmail.tsx` page for email verification flow
- **[CONFIG]** Added `FrontendUrl` configuration setting in appsettings.json and environment variables
- **[API]** Updated 401 interceptor to prevent redirect loops on login/register pages
- **[DOCKER]** Added `FRONTEND_URL` environment variable to docker-compose files
- **[UX]** Registration validation errors now display as detailed bullet-point list instead of generic "Błąd rejestracji"
- **[FEATURE]** Users can now re-register with same email if previous registration was never verified (expired tokens)
- **[API]** Backend automatically removes unverified users and their tokens when re-registering
- **[UX]** Better error messages in Polish for duplicate email/username scenarios
- **[BUG FIX]** Fixed re-registration logic to properly delete unverified users by both email AND username
- **[API]** Re-registration now handles edge cases where email and username might belong to different unverified users
- **[CRITICAL BUG]** Fixed DbUpdateConcurrencyException during email verification
- **[API]** Email verification now properly handles deleted users and tracking conflicts
- **[RESILIENCE]** Added graceful handling for race conditions during re-registration + verification
- **[FEATURE]** Added complete forgot/reset password flow with ForgotPassword.tsx and ResetPassword.tsx pages
- **[CRITICAL BUG]** Fixed reset-password endpoint that was resetting the first user's password instead of correct user
- **[API]** Reset password now properly validates token and finds the correct user
- **[CONFIG]** Password reset links now use frontend URL instead of backend API URL
- **[UX]** Password reset pages include show/hide password toggles and proper error handling
- **[UX]** Added show/hide password toggle with eye icons to Login and Register pages
- **[MOBILE]** Password visibility toggle works on mobile with tap/click (3 password fields total: login, register password, confirm password)

### Security (2025-10-15) - CRITICAL PRE-LAUNCH HARDENING
- **[CRITICAL]** Removed hardcoded database password `Quake112` from appsettings.json
- **[CRITICAL]** Generated cryptographically secure 64-character JWT secret
- **[CRITICAL]** Implemented environment variable configuration system (PRODUCTION.env.example)
- **[CRITICAL]** Enabled HTTPS enforcement in production (RequireHttpsMetadata)
- **[CRITICAL]** Added comprehensive security headers middleware:
  - X-Frame-Options: DENY (clickjacking protection)
  - X-Content-Type-Options: nosniff (MIME sniffing protection)
  - X-XSS-Protection: 1; mode=block (XSS protection)
  - Content-Security-Policy (injection protection)
  - Strict-Transport-Security (HTTPS enforcement)
  - Referrer-Policy (privacy protection)
  - Permissions-Policy (feature restrictions)
- **[HIGH]** Updated CORS configuration to support production domains via environment variables
- **[HIGH]** Replaced all hardcoded secrets with environment variable placeholders

### Documentation (2025-10-15)
- Added `GO_LIVE_PROGRESS_TRACKER.md` - Comprehensive launch tracking system
- Added `SECURITY_IMPLEMENTATION.md` - Detailed security hardening documentation
- Added `PRODUCTION.env.example` - Production environment variable template
- Added `MONETIZATION_SETUP.md` - Complete AdSense and Buy Me a Coffee setup guide

### Added (2025-10-15) - Legal & Monetization
- **[GDPR]** Privacy Policy page - Bilingual (Polish/English), comprehensive GDPR compliance
- **[GDPR]** Terms of Service page - Bilingual, includes content guidelines and moderation policy
- **[MONETIZATION]** Buy Me a Coffee widget integrated in Footer
- **[MONETIZATION]** AdSenseAd component - Ready for AdSense integration
- **[ROUTES]** `/privacy` and `/terms` routes added to App.tsx
- **[NAVIGATION]** Legal page links added to Footer

### Added (2025-10-16) - CI/CD Pipeline & Automated Deployment
- **[CI/CD]** `.github/workflows/deploy.yml` - Complete GitHub Actions deployment pipeline with:
  - Automated build and test for backend (.NET 9) and frontend (React + Vite)
  - Multi-stage Docker image build (frontend → backend → unified runtime)
  - **Manual approval gate** requiring designated reviewers before production deployment
  - Automated SSH deployment to Kamatera production server
  - Comprehensive health checks (API, frontend, database, SSL)
  - **Automatic rollback** if health checks fail (restores previous Docker image)
  - Post-deployment verification and summary
  - Docker image versioning and artifact management
- **[DOCKER]** `Dockerfile.production` - Multi-stage production Dockerfile:
  - Stage 1: Build React frontend with Vite
  - Stage 2: Build .NET 9 backend
  - Stage 3: Unified runtime image with both frontend (wwwroot) and backend
  - Non-root user security
  - Built-in health checks
  - Optimized layer caching
- **[DOCKER]** Updated `docker-compose.production.yml` - Unified container architecture:
  - Single `app` service combining backend + frontend
  - PostgreSQL with auto-initialization script
  - Volume-backed persistence for uploads and database
  - Resource limits and health checks
  - Environment variable configuration
- **[DATABASE]** `database/init-db.sh` - Automatic database initialization on first run
- **[NGINX]** `nginx.production.conf` - Production-ready Nginx configuration:
  - SSL termination with Let's Encrypt
  - Rate limiting for API and uploads
  - Proxy caching for static assets
  - Security headers (HSTS, CSP, X-Frame-Options, etc.)
  - WebSocket support
  - Custom error pages
- **[MONITORING]** `HEALTHCHECK.md` - Comprehensive health check documentation:
  - All endpoints with expected responses
  - Automated health check script (bash)
  - UptimeRobot configuration guide
  - Response time targets and SLAs
  - Failure scenarios and troubleshooting
  - Go-live validation checklist
- **[DOCUMENTATION]** `CI_CD_DEPLOYMENT_GUIDE.md` - 500+ line complete deployment guide:
  - Architecture diagrams and deployment flow
  - GitHub configuration (secrets, environment protection)
  - Server provisioning step-by-step
  - SSH key generation and setup
  - DNS and SSL configuration
  - First deployment procedures
  - Rollback procedures (automatic and manual)
  - Troubleshooting guide
  - Complete deployment checklist

### Added (2025-10-15) - Week 2 Deployment Automation
- **[DEPLOYMENT]** `deploy.ps1` - Automated Windows PowerShell deployment script
- **[DEPLOYMENT]** `deploy.sh` - Automated Linux/Mac deployment script
- **[MONITORING]** `health-check.ps1` - Comprehensive production health check script
- **[CONTENT]** `CONTENT_CREATION_GUIDE.md` - 15+ page guide with templates, examples, and workflow
- **[DOCUMENTATION]** `User_Actions_After_Vibe_Coding_On_MVP.md` - Complete user action checklist (30 actions, 1500+ lines)

### Changed (2025-10-16)
- Updated `DEPLOYMENT.md` to reference new CI/CD pipeline as recommended approach
- Updated `PRODUCTION_SETUP.md` to reference CI/CD guide for automated deployments
- Updated `User_Actions_After_Vibe_Coding_On_MVP.md` with CI/CD setup instructions
- Updated `docker-compose.production.yml` from separate frontend/backend to unified architecture

### Changed (2025-10-15)
- Updated `Program.cs` with conditional HTTPS enforcement based on environment
- Updated `Program.cs` with dynamic CORS configuration from environment variables
- Updated `appsettings.json` to use safe development defaults
- Updated `appsettings.Development.json` to remove hardcoded password
- Updated `Footer.tsx` with Buy Me a Coffee button and updated copyright year to 2025
- Updated `PRODUCTION.env.example` with AdSense and monetization configuration variables

## [1.0.0] - 2025-10-10

### Added
- Initial release of Antystics MVP
- Backend API with .NET 8 and PostgreSQL
- Frontend with React, TypeScript, Vite, and Tailwind CSS
- User authentication system with email verification
- JWT-based authentication with refresh tokens
- Antistics creation and submission workflow
- Moderation system for reviewing submissions
- Admin panel for moderators and administrators
- Like and report functionality for antistics
- Category system for organizing content
- Image watermarking service
- Email service for notifications
- GDPR compliance tools (data export and deletion)
- Docker and Docker Compose configuration
- CI/CD pipeline with GitHub Actions
- Comprehensive documentation (README, DEPLOYMENT, CONTRIBUTING)
- Quick start scripts for Windows and Unix systems

### Backend Features
- ASP.NET Core Web API with Swagger documentation
- Entity Framework Core with PostgreSQL
- Identity system with role-based authorization
- JWT token generation and validation
- Email verification workflow
- Password reset functionality
- Image processing with SixLabors.ImageSharp
- Email sending with MailKit
- File storage service
- Category management
- Report system
- User management for admins

### Frontend Features
- Responsive design with Tailwind CSS
- Main feed with pagination
- Antistic creation form
- User authentication pages (Login, Register)
- Admin moderation panel
- Like/unlike functionality
- Category filtering (prepared)
- Modern UI/UX design

### Infrastructure
- Multi-container Docker setup
- PostgreSQL database container
- Automated database migrations
- Nginx configuration for production
- SSL/HTTPS support
- Environment-based configuration
- Automated backup scripts (in DEPLOYMENT.md)

### Documentation
- Comprehensive README with setup instructions
- Detailed deployment guide
- Contributing guidelines
- API endpoint documentation
- Environment configuration examples
- Quick start scripts

### Security
- JWT-based authentication
- Password hashing with Identity
- Email verification required
- Role-based authorization
- CAPTCHA integration (prepared)
- HTTPS support
- CORS configuration

## [0.1.0] - Development

### Added
- Project initialization
- Basic structure setup
- Technology stack selection

---

## Release Notes

### Version 1.0.0 (MVP)

This is the initial release of Antystics, featuring a complete full-stack application for creating and sharing humorous reversed statistics.

**Key Highlights:**
- Full user authentication with email verification
- Moderation system for quality control
- Admin panel for content management
- Docker deployment ready
- GDPR compliant

**Known Limitations:**
- Image upload feature pending (using predefined backgrounds)
- Full i18n implementation pending (Polish UI only)
- Advanced search and filtering to be added
- User profiles and social features planned for Phase 2

**Upgrade Path:**
- No breaking changes expected in v1.x releases
- Database migrations will be provided for all updates

---

[Unreleased]: https://github.com/yourusername/antystics/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/antystics/releases/tag/v1.0.0
[0.1.0]: https://github.com/yourusername/antystics/releases/tag/v0.1.0



