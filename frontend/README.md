# BBS Frontend

React + Vite frontend for the BBS text social platform.

## Prerequisites

- Node.js 20.19+ or 22.12+ (for Vite 7)
  - **Note:** If you're using Node.js 20.11 or earlier, the project has been configured to use Vite 6 which is compatible
  - To upgrade Node.js: `brew upgrade node` (on macOS with Homebrew) or use [nvm](https://github.com/nvm-sh/nvm)
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the frontend directory:

```bash
cp env.example .env
```

Edit `.env` with your backend API URL:

```env
VITE_API_URL=http://localhost:8000
```

For production, update this to your production backend URL.

## Running the Development Server

```bash
npm run dev
```

The frontend will start at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── Post/        # Post-related components
│   │   ├── Comment/     # Comment components
│   │   ├── User/        # User components
│   │   ├── Layout/      # Layout components
│   │   └── Auth/        # Authentication components
│   ├── pages/           # Page components
│   │   ├── HomePage.tsx
│   │   ├── UserPage.tsx
│   │   ├── SearchPage.tsx
│   │   └── LoginPage.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePosts.ts
│   │   ├── useComments.ts
│   │   └── useLikes.ts
│   ├── services/        # API service functions
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── store/           # State management (Zustand)
│   │   └── authStore.ts
│   ├── utils/           # Utility functions
│   │   ├── dateUtils.ts
│   │   └── markdown.ts
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── package.json
└── README.md           # This file
```

## Features

- React 18 with TypeScript
- Vite for fast development and building
- React Router for navigation
- TanStack Query for server state management
- Zustand for client state management
- Tailwind CSS for styling
- Markdown support for posts and comments
- Dark mode support
- Responsive design
- Anonymous posting support

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: `http://localhost:8000`)

**Important:** Variables starting with `VITE_` are exposed to the browser. Never put secrets in these variables.

## Deployment to Vercel

See the main [DEPLOYMENT.md](../DEPLOYMENT.md) for complete instructions on deploying to Vercel.

**Quick summary:**
1. Connect GitHub repository to Vercel
2. Set root directory to `frontend`
3. Configure build settings (auto-detected for Vite)
4. Set `VITE_API_URL` environment variable to your Render backend URL
5. Deploy

**Environment Variables for Vercel:**
- `VITE_API_URL` - Your Render backend URL (e.g., `https://bbs-backend.onrender.com`)

**Note:** After deployment, update `FRONTEND_URL` in your Render backend to match your Vercel URL.

## Authentication

The frontend supports:
- Google OAuth login (redirects to backend)
- Anonymous posting (no login required)
- JWT token storage in localStorage

## Anonymous Posting

Users can post and comment without logging in:
- Anonymous posts show "Anonymous" or a custom name
- Authenticated users can choose to post anonymously
- Anonymous posts cannot be edited or deleted

## Troubleshooting

### "crypto.hash is not a function" Error

If you encounter this error when running `npm run dev`:

**Cause:** Vite 7 requires Node.js 20.19+ or 22.12+, but you're using an older version (like 20.11).

**Solutions:**

1. **Upgrade Node.js (Recommended):**
   ```bash
   # Using Homebrew (macOS)
   brew upgrade node
   
   # Or using nvm
   nvm install 22
   nvm use 22
   ```
   Then reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Use Vite 6 (Current Setup):**
   The project has been configured to use Vite 6 which works with Node.js 20.11+. If you've upgraded Node.js to 20.19+, you can upgrade back to Vite 7:
   ```bash
   npm install vite@^7.2.4 @vitejs/plugin-react@^5.1.1 --save-dev
   ```

### CORS Errors

- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that `VITE_API_URL` in frontend `.env` matches your backend URL

### Build Errors

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 20.19+ for Vite 7, or 18+ for Vite 6)

### API Connection Errors

- Verify backend is running
- Check `VITE_API_URL` in `.env`
- Check browser console for detailed error messages
