# Antistics / Antystyki

A bilingual humor and data-reversal website presenting funny, thought-provoking reinterpretations of real statistics.

**Example:** "92.4% of accidents were caused by sober drivers."

The site aims to provoke critical thinking about data and media narratives while maintaining respect and avoiding hate or targeted harassment.

## 🎯 Project Overview

Antistics is a full-stack web application that allows users to create, share, and discover humorous reversed statistics. All submissions go through a moderation process to ensure quality and appropriateness.

### Key Features

- **Main Feed**: Browse approved antistics with pagination, search, and category filters
- **User Authentication**: Register, login, email verification, and password reset
- **Create Antistics**: Submit new antistics with mandatory source links
- **Moderation System**: Admin/Moderator panel for reviewing submissions
- **Social Features**: Like, share, and report antistics
- **GDPR Compliance**: Data export and deletion tools
- **Bilingual Ready**: Polish (primary) and English support prepared

## 🛠️ Tech Stack

### Backend
- **.NET 8** (ASP.NET Core Web API)
- **PostgreSQL** (Database)
- **Entity Framework Core** (ORM)
- **JWT Authentication** (with email verification)
- **SixLabors.ImageSharp** (Image processing & watermarking)
- **MailKit** (Email service)

### Frontend
- **React** with **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS** (Styling)
- **React Router** (Navigation)
- **Axios** (HTTP client)
- **i18next** (Internationalization - prepared)

### Infrastructure
- **Docker** & **Docker Compose**
- **GitHub Actions** (CI/CD)
- **Nginx** (Frontend serving)
- **Kamatera Cloud** (Hosting - configured)

## 🚀 Quick Start

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/) & Docker Compose
- [PostgreSQL 16](https://www.postgresql.org/) (or use Docker)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/antystics.git
cd antystics

# Copy environment files
cp frontend/.env.example frontend/.env

# Start all services
docker-compose up -d

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
# - Swagger: http://localhost:5000/swagger
```

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Restore dependencies
dotnet restore

# Update database connection in appsettings.json
# ConnectionStrings:DefaultConnection

# Run migrations
dotnet ef database update --project Antystics.Infrastructure --startup-project Antystics.Api

# Run the API
cd Antystics.Api
dotnet run
```

The API will be available at `http://localhost:5000`

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update VITE_API_URL in .env if needed
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📝 Configuration

### Backend Configuration (`appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=antystics;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "your-super-secret-key-min-32-chars",
    "Issuer": "Antystics",
    "Audience": "AntysticsUsers"
  },
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "SmtpUser": "your-email@gmail.com",
    "SmtpPassword": "your-app-password",
    "FromAddress": "noreply@antystyki.pl",
    "FromName": "Antystyki"
  }
}
```

### Default Admin Account

- **Username**: `admin`
- **Email**: `admin@antystyki.pl`
- **Password**: `Admin123!`

⚠️ **Change this password immediately in production!**

## 🗂️ Project Structure

```
antystics/
├── backend/
│   ├── Antystics.Api/          # Web API project
│   │   ├── Controllers/        # API endpoints
│   │   ├── DTOs/              # Data transfer objects
│   │   └── Program.cs         # Application startup
│   ├── Antystics.Core/        # Domain models
│   │   ├── Entities/          # Database entities
│   │   └── Interfaces/        # Service interfaces
│   ├── Antystics.Infrastructure/  # Data & services
│   │   ├── Data/              # DbContext
│   │   └── Services/          # Implementation
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context (auth)
│   │   ├── config/           # API configuration
│   │   └── types/            # TypeScript types
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Antistics
- `GET /api/antistics` - Get paginated list
- `GET /api/antistics/{id}` - Get single antistic
- `POST /api/antistics` - Create new (auth required)
- `POST /api/antistics/{id}/like` - Like (auth required)
- `DELETE /api/antistics/{id}/like` - Unlike (auth required)
- `POST /api/antistics/{id}/report` - Report (auth required)

### Admin (Moderator/Admin only)
- `GET /api/admin/antistics/pending` - Get pending antistics
- `POST /api/admin/antistics/{id}/moderate` - Approve/reject
- `GET /api/admin/reports` - Get reports
- `POST /api/admin/reports/{id}/resolve` - Resolve report
- `GET /api/admin/users` - Get users (Admin only)
- `POST /api/admin/users/{id}/role` - Update role (Admin only)
- `GET /api/admin/users/{id}/gdpr-export` - Export user data (Admin only)
- `DELETE /api/admin/users/{id}/gdpr-delete` - Delete user data (Admin only)

### Categories
- `GET /api/categories` - Get all active categories

## 🎨 Features Roadmap

### Phase 1 (MVP) - ✅ Completed
- [x] Backend API with .NET 8
- [x] Frontend with React + Vite + Tailwind
- [x] User authentication with email verification
- [x] Antistics CRUD operations
- [x] Admin moderation panel
- [x] Like & report system
- [x] Docker setup
- [x] CI/CD pipeline

### Phase 2 (Bilingual Expansion)
- [ ] Full i18n implementation (Polish + English)
- [ ] User image uploads
- [ ] Advanced watermarking
- [ ] Moderator roles and permissions
- [ ] Statistics and analytics

### Phase 3 (Community & Growth)
- [ ] User profiles and following
- [ ] Comments system
- [ ] Advanced search and filters
- [ ] Social media sharing optimization
- [ ] Mobile app (React Native)

## 🧪 Testing

### Backend Tests
```bash
cd backend
dotnet test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🚢 Deployment

### Kamatera Cloud Deployment

1. **Set up server**:
   - Ubuntu 22.04 LTS
   - 2+ GB RAM
   - Install Docker & Docker Compose

2. **Clone and configure**:
   ```bash
   git clone https://github.com/yourusername/antystics.git
   cd antystics
   cp frontend/.env.example frontend/.env
   # Edit configuration files
   ```

3. **Deploy**:
   ```bash
   docker-compose up -d
   ```

4. **Set up reverse proxy (Nginx)**:
   - Configure SSL with Let's Encrypt
   - Point domain to server IP
   - Configure Nginx to proxy to containers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 Content Guidelines

### What's Allowed
- Humorous reversed statistics with real sources
- Political satire (within reason)
- Thought-provoking data interpretations

### What's NOT Allowed
- Calls to violence or hate speech
- Targeted harassment
- False or misleading sources
- Personal attacks

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- Project Lead: [Your Name]
- Backend: .NET 8 + PostgreSQL
- Frontend: React + TypeScript + Tailwind CSS

## 🙏 Acknowledgments

- Inspired by data literacy and critical thinking initiatives
- Built with modern web technologies
- Hosted on Kamatera Cloud

## 📧 Contact

- Website: [antystyki.pl](https://antystyki.pl) (coming soon)
- Email: contact@antystyki.pl
- GitHub: [github.com/yourusername/antystics](https://github.com/yourusername/antystics)

---

**Made with ❤️ for critical thinkers**



