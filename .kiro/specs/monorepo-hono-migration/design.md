# Design Document

## Overview

This design outlines the migration from a Next.js + Supabase BaaS application to a monorepo architecture with a Vite + React frontend and a custom Hono backend following Domain-Driven Design (DDD) principles. The application is a photo album app with interactive map functionality where users can pin photos to geographic locations.

### Current Application Analysis

The existing application features:

- **Authentication**: GitHub OAuth via Supabase Auth
- **Data Model**: Albums with coordinates, images, and user associations
- **Core Features**: Interactive map with photo markers, photo upload, album management
- **Tech Stack**: Next.js, React, Supabase, Mapbox GL, Zustand for state management

## Architecture

### Monorepo Structure

```
project-root/
├── frontend/                 # Vite + React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/        # API client layer
│   │   ├── store/           # Zustand state management
│   │   ├── types/           # Frontend-specific types
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Hono API with DDD
│   ├── src/
│   │   ├── domain/          # Domain layer (DDD)
│   │   ├── application/     # Application services
│   │   ├── infrastructure/  # External concerns
│   │   ├── presentation/    # HTTP controllers
│   │   └── shared/          # Shared utilities
│   ├── package.json
│   └── drizzle.config.ts
├── shared/                   # Shared types and tRPC contracts
│   ├── types/               # Domain types and interfaces
│   ├── schemas/             # Zod validation schemas
│   └── trpc/                # tRPC router type exports
├── package.json             # Root workspace config
└── README.md
```

### Domain-Driven Design Architecture

#### Domain Layer

- **Entities**: User, Album, Photo
- **Value Objects**: Coordinate, ImageUrl, UserId
- **Domain Services**: AlbumDomainService
- **Repositories**: AlbumRepository (interface)

#### Application Layer

- **Use Cases**: CreateAlbum, GetAllAlbums, DeleteAlbum, AuthenticateUser
- **DTOs**: AlbumCreateDto, AlbumResponseDto, UserDto
- **Application Services**: AlbumApplicationService, AuthApplicationService

#### Infrastructure Layer

- **Database**: Drizzle ORM with PostgreSQL
- **Authentication**: JWT-based auth service
- **File Storage**: AWS S3 integration (existing)
- **Repository Implementations**: DrizzleAlbumRepository

#### Presentation Layer

- **Controllers**: AlbumController, AuthController
- **Middleware**: Authentication, CORS, Error handling
- **Routes**: RESTful API endpoints

## Components and Interfaces

### Frontend Components (Vite + React)

#### Core Components

```typescript
// Map component with photo markers
interface MapboxProps {
  albums: Album[];
  onLocationSelect: (coordinate: Coordinate) => void;
}

// Photo upload and album creation
interface AlbumFormProps {
  coordinate: Coordinate;
  onSubmit: (album: CreateAlbumRequest) => Promise<void>;
}

// Authentication component
interface AuthButtonProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}
```

#### tRPC Integration with Hono

```typescript
// Backend tRPC router definition
const appRouter = router({
  album: {
    getAll: publicProcedure.query(async () => {
      return await getAllAlbumsUseCase.execute();
    }),
    create: protectedProcedure
      .input(createAlbumSchema)
      .mutation(async ({ input, ctx }) => {
        return await createAlbumUseCase.execute(input, ctx.userId);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return await deleteAlbumUseCase.execute(input.id, ctx.userId);
      }),
  },
  auth: {
    signIn: publicProcedure.input(signInSchema).mutation(async ({ input }) => {
      return await authService.signIn(input.provider);
    }),
    signOut: protectedProcedure.mutation(async ({ ctx }) => {
      return await authService.signOut(ctx.userId);
    }),
  },
});

export type AppRouter = typeof appRouter;

// Frontend tRPC client (fully type-safe)
const trpc = createTRPCReact<AppRouter>();

// Usage in React components
function AlbumList() {
  const { data: albums, isLoading } = trpc.album.getAll.useQuery();
  const createAlbum = trpc.album.create.useMutation();

  const handleCreateAlbum = (albumData: CreateAlbumRequest) => {
    createAlbum.mutate(albumData, {
      onSuccess: () => {
        // Automatically refetch albums with type safety
        trpc.album.getAll.invalidate();
      },
    });
  };

  // Full type safety - TypeScript knows the exact shape of albums
  return (
    <div>
      {albums?.map(album => (
        <div key={album.id}>
          {/* TypeScript autocomplete for album properties */}
          <p>
            Coordinates: {album.coordinate.lng}, {album.coordinate.lat}
          </p>
        </div>
      ))}
    </div>
  );
}
```

#### Shared Type Safety Architecture

```typescript
// shared/schemas/album.ts - Zod schemas for validation
export const coordinateSchema = z.object({
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
});

export const createAlbumSchema = z.object({
  coordinate: coordinateSchema,
  imageUrls: z.array(z.string().url()).min(1).max(10),
});

export const albumResponseSchema = z.object({
  id: z.string().uuid(),
  coordinate: coordinateSchema,
  imageUrls: z.array(z.string().url()),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

// shared/types/album.ts - Inferred TypeScript types
export type Coordinate = z.infer<typeof coordinateSchema>;
export type CreateAlbumRequest = z.infer<typeof createAlbumSchema>;
export type Album = z.infer<typeof albumResponseSchema>;
```

### Backend API Interfaces

#### Domain Entities

```typescript
// Domain Entity
class Album {
  constructor(
    private id: AlbumId,
    private coordinate: Coordinate,
    private imageUrls: ImageUrl[],
    private userId: UserId,
    private createdAt: Date
  ) {}

  // Domain methods
  addImage(imageUrl: ImageUrl): void;
  removeImage(imageUrl: ImageUrl): void;
  isOwnedBy(userId: UserId): boolean;
}

// Value Objects
class Coordinate {
  constructor(
    private lng: number,
    private lat: number
  ) {
    this.validate();
  }
}
```

#### Repository Interfaces

```typescript
interface AlbumRepository {
  save(album: Album): Promise<void>;
  findById(id: AlbumId): Promise<Album | null>;
  findByUserId(userId: UserId): Promise<Album[]>;
  findAll(): Promise<Album[]>;
  delete(id: AlbumId): Promise<void>;
}
```

#### Use Cases

```typescript
class GetAllAlbumsUseCase {
  constructor(private albumRepository: AlbumRepository) {}

  async execute(): Promise<AlbumResponseDto[]> {
    const albums = await this.albumRepository.findAll();
    return albums.map((album) => this.toDto(album));
  }
}

class CreateAlbumUseCase {
  constructor(
    private albumRepository: AlbumRepository,
    private authService: AuthService
  ) {}

  async execute(
    request: CreateAlbumRequest,
    userId: UserId
  ): Promise<AlbumResponseDto> {
    const album = new Album(
      AlbumId.generate(),
      new Coordinate(request.coordinate.lng, request.coordinate.lat),
      request.imageUrls.map((url) => new ImageUrl(url)),
      userId,
      new Date()
    );

    await this.albumRepository.save(album);
    return this.toDto(album);
  }
}
```

#### Hono Controllers

```typescript
class AlbumController {
  constructor(
    private getAllAlbumsUseCase: GetAllAlbumsUseCase,
    private createAlbumUseCase: CreateAlbumUseCase,
    private deleteAlbumUseCase: DeleteAlbumUseCase
  ) {}

  async getAll(c: Context): Promise<Response> {
    const albums = await this.getAllAlbumsUseCase.execute();
    return c.json(albums);
  }

  async create(c: Context): Promise<Response> {
    const userId = c.get('userId');
    const request = await c.req.json();
    const album = await this.createAlbumUseCase.execute(request, userId);
    return c.json(album, 201);
  }
}
```

## Data Models

### Database Schema (Drizzle ORM)

```typescript
// Database schema definition
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: varchar('github_id', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const albums = pgTable('albums', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  coordinate: json('coordinate')
    .$type<{ lng: number; lat: number }>()
    .notNull(),
  imageUrls: json('image_urls').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Domain Models

```typescript
// Shared types between frontend and backend
export interface Album {
  id: string;
  coordinate: {
    lng: number;
    lat: number;
  };
  imageUrls: string[];
  userId: string;
  createdAt: string;
}

export interface User {
  id: string;
  githubId: string;
  username: string;
  avatarUrl?: string;
  name?: string;
}

export interface CreateAlbumRequest {
  coordinate: {
    lng: number;
    lat: number;
  };
  imageUrls: string[];
}
```

## Error Handling

### Backend Error Handling

```typescript
// Domain exceptions
class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

class AlbumNotFoundError extends DomainError {
  constructor(albumId: string) {
    super(`Album with id ${albumId} not found`);
  }
}

// Global error handler middleware
const errorHandler = async (err: Error, c: Context, next: Next) => {
  if (err instanceof DomainError) {
    return c.json({ error: err.message }, 400);
  }

  if (err instanceof AlbumNotFoundError) {
    return c.json({ error: err.message }, 404);
  }

  console.error('Unexpected error:', err);
  return c.json({ error: 'Internal server error' }, 500);
};
```

### Frontend Error Handling

```typescript
// API client error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
  }
}

// React error boundary for map components
class MapErrorBoundary extends Component<Props, State> {
  // Error boundary implementation
}
```

## Testing Strategy

### Backend Testing

#### Unit Tests

- **Domain Entities**: Test business logic and invariants
- **Use Cases**: Test application logic with mocked repositories
- **Value Objects**: Test validation and behavior

#### Integration Tests

- **Repository Implementations**: Test database operations
- **API Endpoints**: Test HTTP layer with test database
- **Authentication Flow**: Test JWT generation and validation

#### Test Structure

```typescript
// Domain entity tests
describe('Album Entity', () => {
  it('should create album with valid data', () => {
    const album = new Album(/* valid data */);
    expect(album.isValid()).toBe(true);
  });

  it('should throw error for invalid coordinates', () => {
    expect(() => new Album(/* invalid coordinates */)).toThrow(
      InvalidCoordinateError
    );
  });
});

// Use case tests
describe('CreateAlbumUseCase', () => {
  it('should create album successfully', async () => {
    const mockRepository = createMockAlbumRepository();
    const useCase = new CreateAlbumUseCase(mockRepository);

    const result = await useCase.execute(validRequest, userId);

    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### Frontend Testing

#### Component Tests

- **Map Component**: Test marker rendering and interaction
- **Album Form**: Test form validation and submission
- **Auth Components**: Test authentication state changes

#### Integration Tests

- **API Integration**: Test API client with mock server
- **State Management**: Test Zustand store operations
- **Routing**: Test client-side navigation

## Migration Strategy

### Phase 1: Monorepo Setup

1. Create monorepo structure with workspaces
2. Move existing Next.js code to `frontend/` directory
3. Set up Vite + React configuration
4. Configure shared types package

### Phase 2: Backend Foundation

1. Set up Hono project structure with DDD layers
2. Configure Drizzle ORM with database schema
3. Implement domain entities and value objects
4. Set up dependency injection container

### Phase 3: Authentication Migration

1. Implement JWT-based authentication service
2. Create GitHub OAuth integration
3. Migrate auth endpoints from Supabase to custom implementation
4. Update frontend to use new auth API

### Phase 4: Data Layer Migration

1. Implement repository pattern with Drizzle
2. Create use cases for album operations
3. Build API controllers and routes
4. Update frontend API client

### Phase 5: Frontend Migration

1. Convert Next.js components to Vite + React
2. Implement client-side routing
3. Update state management for new API
4. Test and optimize bundle size

### Phase 6: Integration and Testing

1. End-to-end testing of complete flow
2. Performance optimization
3. Error handling refinement
4. Documentation updates
