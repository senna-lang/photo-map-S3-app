# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo photo mapping application that allows users to upload photos with location data and view them on an interactive map. The project has been migrated from Next.js + Supabase to a custom backend with Hono and Vite + React frontend following Domain-Driven Design principles.

## Development Commands

### Root Commands

- `npm run dev` - Start both frontend and backend concurrently
- `npm run dev:frontend` - Start only the frontend (Vite dev server on port 3000)
- `npm run dev:backend` - Start only the backend (Hono server on port 3001)
- `npm run build` - Build both frontend and backend
- `npm run lint` - Lint both frontend and backend
- `npm run test` - Run tests for both frontend and backend
- `npm run typecheck` - Type check both frontend and backend
- `npm run format` - Format code using Prettier
- `npm run format:check` - Check code formatting
- `npm run clean` - Clean build artifacts

### Backend Commands

- `npm run build --workspace=backend` - Build backend TypeScript
- `npm run test --workspace=backend` - Run backend tests (Vitest)
- `npm run test:watch --workspace=backend` - Run backend tests in watch mode
- `npm run typecheck --workspace=backend` - Type check backend code
- `npm run lint --workspace=backend` - Lint backend code
- `npm run db:generate --workspace=backend` - Generate Drizzle migrations
- `npm run db:migrate --workspace=backend` - Run database migrations
- `npm run db:studio --workspace=backend` - Open Drizzle Studio
- `npm run db:seed --workspace=backend` - Seed database with test data
- `npm run db:seed:clear --workspace=backend` - Clear seeded data
- `npm run db:seed:stats --workspace=backend` - Show seed statistics
- `npm run db:test --workspace=backend` - Run test database migrations

### Frontend Commands

- `npm run build --workspace=frontend` - Build frontend for production
- `npm run preview --workspace=frontend` - Preview production build
- `npm run typecheck --workspace=frontend` - Type check frontend code
- `npm run lint --workspace=frontend` - Lint frontend code

## Architecture

### Monorepo Structure

```
├── backend/                  # Hono API with Domain-Driven Design
│   ├── src/
│   │   ├── domain/          # Business entities, value objects, repositories
│   │   ├── application/     # Use cases and application services
│   │   ├── infrastructure/  # Database, auth, external services
│   │   ├── presentation/    # HTTP routes, middleware, controllers
│   │   └── schemas/         # Zod validation schemas
│   └── drizzle.config.ts    # Database configuration
├── frontend/                # Vite + React SPA
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Route components
│   │   ├── stores/          # Zustand state management
│   │   ├── services/        # API client (Hono RPC)
│   │   └── lib/            # Utilities
│   └── vite.config.ts      # Vite configuration
└── package.json            # Root workspace configuration
```

### Technology Stack

#### Backend (Domain-Driven Design)

- **Framework**: Hono with native RPC for type-safe API communication
- **Database**: Drizzle ORM with PostgreSQL
- **Authentication**: JWT-based auth with GitHub OAuth
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: neverthrow for functional error handling
- **Architecture**: Clean Architecture with DDD principles

#### Frontend (Single Page Application)

- **Framework**: Vite + React + TypeScript
- **State Management**: Zustand stores for auth and albums
- **Styling**: Tailwind CSS with shadcn/ui components
- **Map Integration**: Mapbox GL with react-map-gl
- **Forms**: React Hook Form with Zod validation
- **API Client**: Hono RPC client with full type safety

### Key Features

**Authentication Flow:**

1. GitHub OAuth integration through backend
2. JWT token-based session management
3. Persistent auth state with localStorage
4. Protected routes and API endpoints

**Album Management:**

1. Interactive map for coordinate selection
2. Multi-image upload with S3 integration
3. Real-time album creation and deletion
4. Ownership-based access control

**Type Safety:**

1. End-to-end type safety from backend to frontend
2. Shared Zod schemas for validation
3. Hono RPC provides automatic type inference
4. Domain-driven value objects with validation

### Environment Configuration

#### Backend (.env)

```
DATABASE_URL=postgresql://localhost:5432/photo_map_dev
JWT_SECRET=your-jwt-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-aws-region
S3_BUCKET_NAME=your-s3-bucket
```

#### Frontend (.env)

```
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
VITE_API_BASE_URL=http://localhost:3001
```

### Development Workflow

1. **Start Development**: `npm run dev` starts both frontend and backend
2. **Database Setup**: Run migrations with `npm run db:migrate --workspace=backend`
3. **Type Safety**: Backend exports `AppType` consumed by frontend Hono client
4. **Hot Reload**: Both frontend (Vite HMR) and backend (tsx watch) support hot reload

### Important Implementation Details

- **Domain Layer**: Business logic isolated in entities and value objects
- **Repository Pattern**: Abstract data access with Drizzle implementations
- **Use Cases**: Application logic separated from HTTP concerns
- **Error Handling**: Consistent Result types throughout the backend
- **Authentication**: JWT middleware with optional/required auth endpoints
- **File Upload**: S3 integration for photo storage with public URLs
- **Map Integration**: Mapbox GL for interactive maps with custom markers

When modifying this codebase, follow the established DDD patterns, maintain type safety throughout the stack, and ensure proper error handling with Result types.
