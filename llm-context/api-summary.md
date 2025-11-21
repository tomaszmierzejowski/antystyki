# API Summary

Base URL: `/api`

## Authentication (`AuthController`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login (JWT)
- `POST /auth/social-login` - Google OAuth login
- `POST /auth/verify-email` - Verify email token
- `POST /auth/resend-verification-email` - Resend token
- `POST /auth/forgot-password` - Request reset link
- `POST /auth/reset-password` - Set new password

## Antistics (`AntisticsController`)
- `GET /antistics` - List approved antistics (paginated, search, filter)
- `GET /antistics/{id}` - Get details
- `POST /antistics` - Create new antistic (Auth required)
- `DELETE /antistics/{id}` - Delete (Owner/Admin)
- `POST /antistics/{id}/like` - Toggle like
- `DELETE /antistics/{id}/like` - Remove like
- `POST /antistics/{id}/report` - Report content
- `POST /antistics/{id}/hide` - Hide content (Admin/Mod)
- `POST /antistics/{id}/unhide` - Unhide content (Admin/Mod)
- `GET /antistics/{id}/comments` - Get comments
- `POST /antistics/{id}/comments` - Add comment
- `DELETE /antistics/{id}/comments/{commentId}` - Delete comment

## Statistics (`StatisticsController`)
- `GET /statistics` - List statistics
- `GET /statistics/{id}` - Get statistic details
- `POST /statistics` - Create statistic (Auth required)
- `POST /statistics/{id}/vote` - Vote (Trust/Fake/Like/Dislike)

## Categories (`CategoriesController`)
- `GET /categories` - List active categories

## Admin (`AdminController`)
- `GET /admin/antistics/pending` - Moderation queue
- `POST /admin/antistics/{id}/moderate` - Approve/Reject
- `GET /admin/statistics/pending` - Statistic moderation queue
- `POST /admin/statistics/{id}/moderate` - Moderate statistic
- `GET /admin/reports` - List reports
- `POST /admin/reports/{id}/resolve` - Resolve report
- `GET /admin/users` - List users
- `POST /admin/users/{id}/role` - Change user role
- `GET /admin/users/{id}/gdpr-export` - Export user data
- `DELETE /admin/users/{id}/gdpr-delete` - Delete user

## Visitor Metrics (`VisitorMetricsController`)
- `GET /metrics/visitors/daily` - Get daily visitor stats (Admin only)

## Logs (`LogsController`)
- `POST /logs/client` - Log client-side errors

