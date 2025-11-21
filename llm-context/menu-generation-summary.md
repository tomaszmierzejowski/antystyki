# Menu & Navigation Summary

## Navigation Structure (`frontend/src/components/Navbar.tsx`)

The application uses a responsive navigation bar with the following structure:

### Desktop Menu
1. **Home** (`/`) - "Główna"
2. **Statistics** (`/statistics`) - "Statystyki"
3. **Create** (`/create`) - "Dodaj"
4. **Top** (`/topka`) - "Topka"
5. **Templates** (`/templates`) - "Szablony"
6. **About** (`/about`) - "O nas"

### User Menu (Authenticated)
- **Username Display**
- **Moderation** (`/admin`) - Visible only to Admin/Moderator roles
- **Logout** - Action

### Guest Menu (Unauthenticated)
- **Login** (`/login`)

### Mobile Menu
- Collapsible hamburger menu containing all the above links.

## Routing (`frontend/src/App.tsx`)
- Uses `react-router-dom`.
- **Protected Routes**:
  - `/create` (User)
  - `/admin/*` (Admin/Moderator)

