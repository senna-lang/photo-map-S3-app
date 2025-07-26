import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createAuthRoutes, createAlbumRoutes } from './routes';
import {
  DrizzleUserRepository,
  DrizzleAlbumRepository,
} from '../infrastructure/repositories';
import { GitHubOAuthService, JwtService } from '../infrastructure/auth';
import { S3Service } from '../infrastructure/storage';
import { db } from '../infrastructure/database';

const app = new Hono();

// Global middleware
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Allow frontend origins
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use('*', logger());

// Dependency injection setup
const userRepository = new DrizzleUserRepository(db);
const albumRepository = new DrizzleAlbumRepository(db);

const gitHubService = new GitHubOAuthService({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: process.env.GITHUB_REDIRECT_URI!,
});

const jwtService = new JwtService({
  secret: process.env.JWT_SECRET!,
  expiresIn: '7d',
});

const s3Service = new S3Service({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
  bucketName: process.env.S3_BUCKET_NAME!,
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Photo Map API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      albums: '/api/albums',
      auth: '/api/auth',
    },
  });
});

// API routes
app.route(
  '/api/auth',
  createAuthRoutes(userRepository, gitHubService, jwtService)
);
app.route(
  '/api/albums',
  createAlbumRoutes(albumRepository, jwtService, s3Service)
);

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Something went wrong',
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Export the app with proper typing for RPC
const routes = app;

export default app;
export type AppType = typeof routes;
