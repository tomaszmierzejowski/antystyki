# Antystyki Architecture Summary

## High-Level Overview
Antystyki is a full-stack web application built with a clear separation of concerns, following Clean Architecture principles on the backend and a modern component-based structure on the frontend.

### Tech Stack
- **Backend**: ASP.NET Core 9 Web API
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Database**: PostgreSQL 16 with Entity Framework Core
- **Infrastructure**: Docker, Nginx, GitHub Actions CI/CD

## Backend Architecture (`backend/`)
The backend is divided into three main projects:

1. **Antystics.Api** (Presentation Layer)
   - Contains Controllers, DTOs, Middleware, and Program.cs.
   - Handles HTTP requests, validation, and response formatting.
   - entry point: `Program.cs`

2. **Antystics.Core** (Domain Layer)
   - Contains Entities (database models) and Interfaces (service contracts).
   - No dependencies on other layers.
   - key folder: `Entities/`

3. **Antystics.Infrastructure** (Data/Service Layer)
   - Implements Core interfaces.
   - Contains `ApplicationDbContext` and Migrations.
   - Handles external services (Email, Storage, SocialAuth).

## Frontend Architecture (`frontend/`)
The frontend is a Single Page Application (SPA):

- **`src/components/`**: Reusable UI components (atomic design inspired).
- **`src/pages/`**: Route-level components.
- **`src/context/`**: Global state management (primarily `AuthContext`).
- **`src/api/`**: Axios client wrappers for backend endpoints.
- **`src/config/`**: Configuration constants.

## Deployment & Infrastructure
- **Docker**: Multi-stage builds for production.
- **Nginx**: Serves frontend static files and reverse proxies API requests.
- **CI/CD**: GitHub Actions for automated deployment.

