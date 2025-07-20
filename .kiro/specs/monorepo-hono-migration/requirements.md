# Requirements Document

## Introduction

This feature involves restructuring the current Next.js frontend project into a monorepo architecture, migrating the frontend from Next.js to Vite + React for better SPA performance, and migrating from Supabase Backend-as-a-Service (BaaS) to a custom TypeScript backend implementation using the Hono framework. The goal is to maintain all existing functionality while gaining more control over the backend implementation, improving frontend performance, and creating a scalable monorepo structure.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to restructure the project into a monorepo with separate frontend and backend directories, so that I can manage both codebases independently while maintaining a unified development workflow.

#### Acceptance Criteria

1. WHEN the project is restructured THEN the system SHALL have a `frontend/` directory containing the migrated Vite + React application
2. WHEN the project is restructured THEN the system SHALL have a `backend/` directory for the new Hono implementation
3. WHEN the monorepo is set up THEN the system SHALL maintain a root-level package.json with workspace configuration
4. WHEN developers run commands THEN the system SHALL support running frontend and backend independently or together
5. IF a developer makes changes to shared types THEN the system SHALL ensure type consistency across frontend and backend

### Requirement 2

**User Story:** As a developer, I want to implement a Hono-based backend that replaces Supabase functionality, so that I have full control over the API implementation and can customize business logic as needed.

#### Acceptance Criteria

1. WHEN the backend is implemented THEN the system SHALL use Hono framework for HTTP routing and middleware
2. ✅ WHEN the backend architecture is designed THEN the system SHALL follow Domain-Driven Design (DDD) principles with clear domain boundaries (COMPLETED: Domain layer implemented with entities, value objects, and repository interfaces)
3. WHEN API endpoints are created THEN the system SHALL replicate all existing Supabase functionality
4. WHEN authentication is implemented THEN the system SHALL maintain user session management equivalent to current Supabase auth
5. 🔄 WHEN database operations are performed THEN the system SHALL use Drizzle ORM with TypeScript for type-safe database queries (IN PROGRESS: Repository interfaces defined, implementation pending)
6. IF the backend receives requests THEN the system SHALL handle CORS appropriately for the frontend

### Requirement 3

**User Story:** As a developer, I want to migrate authentication from Supabase Auth to a custom implementation, so that I can control the authentication flow and user management directly.

#### Acceptance Criteria

1. WHEN users authenticate THEN the system SHALL provide login/logout functionality equivalent to current Supabase auth
2. WHEN user sessions are managed THEN the system SHALL maintain secure session handling with JWT or similar
3. WHEN authentication state changes THEN the system SHALL update the frontend state appropriately
4. WHEN users access protected routes THEN the system SHALL enforce authentication requirements
5. IF authentication fails THEN the system SHALL provide appropriate error handling and user feedback

### Requirement 4

**User Story:** As a developer, I want to migrate database operations from Supabase client to custom API endpoints, so that all data operations go through the controlled backend layer.

#### Acceptance Criteria

1. WHEN database queries are made THEN the system SHALL route them through Hono API endpoints instead of direct Supabase client calls
2. WHEN data is retrieved THEN the system SHALL maintain the same data structure and types as the current implementation
3. WHEN data is modified THEN the system SHALL ensure proper validation and error handling
4. WHEN the frontend makes requests THEN the system SHALL use HTTP client instead of Supabase client
5. IF database operations fail THEN the system SHALL provide meaningful error responses to the frontend

### Requirement 5

**User Story:** As a developer, I want to maintain all existing frontend functionality during the migration, so that users experience no disruption in features or user interface.

#### Acceptance Criteria

1. WHEN the migration is complete THEN the system SHALL preserve all existing UI components and their functionality
2. WHEN users interact with the map feature THEN the system SHALL maintain the same behavior as before migration
3. WHEN users submit forms THEN the system SHALL process them through the new backend while maintaining the same UX
4. WHEN authentication flows are used THEN the system SHALL provide the same user experience as the current implementation
5. IF any feature breaks during migration THEN the system SHALL be rolled back to maintain functionality

### Requirement 6

**User Story:** As a developer, I want to migrate the frontend from Next.js to Vite + React, so that I can achieve better performance and development experience for the interactive SPA.

#### Acceptance Criteria

1. WHEN the frontend is migrated THEN the system SHALL use Vite as the build tool instead of Next.js
2. WHEN the application runs THEN the system SHALL maintain all existing React components and functionality
3. WHEN the build process executes THEN the system SHALL produce optimized bundles suitable for SPA deployment
4. WHEN development server starts THEN the system SHALL provide faster hot module replacement than the current Next.js setup
5. IF routing is needed THEN the system SHALL implement client-side routing appropriate for SPA architecture

### Requirement 7

**User Story:** As a developer, I want proper development tooling and scripts for the monorepo, so that I can efficiently develop, test, and deploy both frontend and backend components.

#### Acceptance Criteria

1. WHEN development starts THEN the system SHALL provide scripts to run frontend and backend concurrently
2. WHEN code is built THEN the system SHALL support building both projects independently or together
3. WHEN tests are run THEN the system SHALL execute tests for both frontend and backend
4. WHEN dependencies are managed THEN the system SHALL handle shared dependencies appropriately
5. IF deployment is needed THEN the system SHALL support deploying frontend and backend to their respective environments
