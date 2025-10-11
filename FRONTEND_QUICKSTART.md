# Frontend Quick Start Guide

Welcome! This guide will help you start the React frontend for Antystics.

## Prerequisites

Before you begin, make sure you have:
- ✅ Node.js 20+ installed ([Download here](https://nodejs.org/))
- ✅ Backend running on `http://localhost:5000`

## Step 1: Navigate to Frontend Directory

Open a **new terminal/command prompt** (keep the backend running in the other terminal).

```bash
cd frontend
```

Or if you're in the project root:
```bash
cd C:\Users\tmier\source\repos\antystics\frontend
```

## Step 2: Install Dependencies (First Time Only)

If this is your first time running the frontend, install all required packages:

```bash
npm install
```

This will download all necessary React libraries and dependencies. It may take 1-2 minutes.

**You only need to do this once**, unless new packages are added to the project.

## Step 3: Check Environment Configuration

Make sure you have a `.env` file in the `frontend` folder:

```bash
# Check if .env exists
dir .env      # Windows
ls .env       # Mac/Linux
```

If it doesn't exist, create it:

```bash
# Copy the example file
copy .env.example .env      # Windows
cp .env.example .env        # Mac/Linux
```

The `.env` file should contain:
```
VITE_API_URL=http://localhost:5000/api
```

## Step 4: Start the Development Server

Now start the React development server:

```bash
npm run dev
```

You should see output like this:
```
  VITE v7.1.9  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Step 5: Open in Browser

Open your web browser and go to:

**http://localhost:5173**

You should see the Antystics homepage! 🎉

## What You Should See

1. **Homepage** with "Antystyki" title
2. **Navigation bar** with "Zaloguj się" (Login) and "Zarejestruj się" (Register) buttons
3. A message saying "Brak antystyków do wyświetlenia" (No antistics to display) - this is normal since the database is empty

## Next Steps

### 1. Login as Admin

Click "Zaloguj się" (Login) and use these credentials:
- **Email:** `admin@antystyki.pl`
- **Password:** `Admin123!`

### 2. Create Your First Antistic

After logging in:
1. Click "Stwórz Antystyk" (Create Antistic)
2. Fill in the form:
   - **Tytuł** (Title): Your antistic title
   - **Odwrócona statystyka** (Reversed statistic): The funny statistic
   - **Źródło** (Source): Link to the original data
   - **Kategorie** (Categories): Select relevant categories
3. Click "Wyślij do moderacji" (Send for moderation)

### 3. Approve It (Admin Panel)

1. Click "Panel Moderatora" (Moderator Panel)
2. You'll see your submission
3. Click "✓ Zatwierdź" (Approve)
4. Go back to homepage to see it published!

## Common Commands

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Run Linter
```bash
npm run lint
```

## Troubleshooting

### Port Already in Use

If you see an error like "Port 5173 is already in use":

1. Stop the existing process using that port
2. Or let Vite use another port - it will ask you automatically

### "Cannot GET /" Error

Make sure:
- You're using `http://localhost:5173` (not port 3000)
- The development server is running (check your terminal)

### API Errors / "Network Error"

Make sure:
- Backend is running on `http://localhost:5000`
- Check `.env` file has correct `VITE_API_URL`
- Try opening `http://localhost:5000/swagger` in browser to verify backend is running

### White Screen or Errors in Browser Console

1. Open browser DevTools (F12)
2. Check the Console tab for errors
3. Most common issue: Backend not running

### Changes Not Showing Up

The React dev server has **Hot Module Replacement (HMR)**, which means:
- ✅ Most changes appear instantly without refresh
- 🔄 Sometimes you need to refresh the browser manually (F5)
- 🔄 If still not working, stop the server (Ctrl+C) and run `npm run dev` again

## Understanding the React Development Server

### What is it?

- **Vite** is a modern build tool that serves your React application
- It runs a local web server on your computer
- Changes you make to `.tsx` files are instantly reflected in the browser

### Development vs Production

**Development Mode** (`npm run dev`):
- ✅ Fast refresh on code changes
- ✅ Better error messages
- ✅ Source maps for debugging
- ❌ Larger file sizes
- ❌ Not optimized

**Production Mode** (`npm run build`):
- ✅ Optimized and minified code
- ✅ Smaller file sizes
- ✅ Better performance
- ❌ No hot reload
- ❌ Harder to debug

For development, always use `npm run dev`.

## File Structure

Here's what's in the frontend folder:

```
frontend/
├── src/                      # Source code
│   ├── components/          # Reusable React components
│   │   ├── AntisticCard.tsx   # Card for displaying antistics
│   │   └── Navbar.tsx         # Navigation bar
│   ├── pages/               # Page components (routes)
│   │   ├── Home.tsx           # Homepage feed
│   │   ├── Login.tsx          # Login page
│   │   ├── Register.tsx       # Registration page
│   │   ├── CreateAntistic.tsx # Create form
│   │   └── AdminPanel.tsx     # Moderation panel
│   ├── context/             # React Context (state management)
│   │   └── AuthContext.tsx    # Authentication state
│   ├── config/              # Configuration
│   │   └── api.ts             # Axios API client
│   ├── types/               # TypeScript types
│   │   └── index.ts           # Type definitions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static files
├── .env                     # Environment variables
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── tailwind.config.js       # Tailwind CSS config
```

## Making Changes

### To Edit a Page

1. Open the relevant file in `src/pages/`
2. Make your changes
3. Save the file
4. See changes instantly in browser!

Example - Edit the homepage title:

**File:** `src/pages/Home.tsx`

Find this line:
```tsx
<h1 className="text-4xl font-bold text-gray-900 mb-2">
  Antystyki
</h1>
```

Change to:
```tsx
<h1 className="text-4xl font-bold text-gray-900 mb-2">
  Welcome to Antystyki!
</h1>
```

Save and see it update immediately!

### To Style Components

This project uses **Tailwind CSS** - a utility-first CSS framework.

Instead of writing CSS, you add classes:

```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-md">
  Click Me
</button>
```

- `px-4` = padding left/right
- `py-2` = padding top/bottom
- `bg-blue-600` = blue background
- `text-white` = white text
- `rounded-md` = rounded corners

[Tailwind CSS Docs](https://tailwindcss.com/docs)

## Stopping the Server

To stop the development server:

1. Go to the terminal running `npm run dev`
2. Press **Ctrl + C**
3. Confirm with **Y** (Yes) if prompted

## Tips for React Beginners

### 1. Components Are Building Blocks

React apps are made of **components** - reusable pieces of UI.

Example:
```tsx
function Welcome() {
  return <h1>Hello!</h1>;
}
```

### 2. State Makes Things Interactive

Use `useState` to store data that can change:

```tsx
const [count, setCount] = useState(0);

<button onClick={() => setCount(count + 1)}>
  Clicked {count} times
</button>
```

### 3. Props Pass Data

Components can receive data via **props**:

```tsx
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

<Greeting name="Tom" />
```

### 4. Check Browser Console

Always have DevTools open (F12) to see:
- Console logs
- Errors
- Network requests
- React DevTools (install extension)

## Learning Resources

### Official React Documentation
- [React Quick Start](https://react.dev/learn)
- [React Tutorial](https://react.dev/learn/tutorial-tic-tac-toe)

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)

### TypeScript
- [TypeScript for React](https://react-typescript-cheatsheet.netlify.app/)

## Need Help?

Common issues:

1. **Backend not responding?**
   - Check if backend is running: `http://localhost:5000/swagger`
   - Check `.env` file has correct API URL

2. **Dependencies not installing?**
   - Delete `node_modules` folder
   - Delete `package-lock.json` file
   - Run `npm install` again

3. **Build errors?**
   - Read the error message carefully
   - Check for typos in your code
   - Make sure all imports are correct

4. **Blank page?**
   - Check browser console (F12) for errors
   - Check terminal for build errors

---

## Quick Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Stop server
Ctrl + C
```

**Frontend URL:** http://localhost:5173  
**Backend URL:** http://localhost:5000  
**API Docs:** http://localhost:5000/swagger

---

**Happy coding! 🚀**

If you see the Antystics homepage at http://localhost:5173, you're all set!

