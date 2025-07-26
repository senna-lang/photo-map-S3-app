# Photo Map S3 Application

A modern photo mapping application built with a monorepo architecture, allowing users to upload photos with location data and view them on an interactive map.

## Architecture

This project has been migrated from Next.js + Supabase to a custom implementation with:

- **Backend**: Hono with Domain-Driven Design (DDD)
- **Frontend**: Vite + React SPA
- **Database**: Drizzle ORM + PostgreSQL
- **Authentication**: JWT + GitHub OAuth
- **Type Safety**: End-to-end with Hono RPC

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- GitHub OAuth app
- Mapbox account
- AWS S3 bucket (optional)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure your environment variables in the .env files

# Run database migrations
npm run db:migrate --workspace=backend

# Start development servers
npm run dev
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Features

- 🗺️ Interactive map with Mapbox GL
- 📸 Photo album creation with location tagging
- 🔐 GitHub OAuth authentication
- 📱 Responsive design
- ⚡ Real-time updates
- 🔒 Ownership-based access control
- 🎯 Type-safe API communication

## Technology Stack

### Backend

- **Hono**: Fast web framework with RPC
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Primary database
- **JWT**: Authentication tokens
- **neverthrow**: Functional error handling
- **Zod**: Schema validation

### Frontend

- **Vite**: Build tool and dev server
- **React**: UI framework
- **TypeScript**: Type safety
- **Zustand**: State management
- **Tailwind CSS**: Styling
- **React Hook Form**: Form handling
- **Mapbox GL**: Interactive maps

## Development

### Monorepo Structure

```
├── backend/          # Hono API server
├── frontend/         # Vite React application
├── package.json      # Root workspace configuration
└── README.md
```

### Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run build` - Build both applications
- `npm run lint` - Lint all code
- `npm run clean` - Clean build artifacts

See [CLAUDE.md](./CLAUDE.md) for detailed development guidance.

## Deployment

The application can be deployed to any platform supporting Node.js:

- Backend: Deploy to services like Railway, Render, or AWS
- Frontend: Deploy to Vercel, Netlify, or any static hosting
- Database: Use managed PostgreSQL from your cloud provider

## License

This project is private and not licensed for public use.
