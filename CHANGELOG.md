# Changelog

All notable changes to the Antystics project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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



