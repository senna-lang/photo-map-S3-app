import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { albums } from './routes/albums.js';
import { auth } from './routes/auth.js';
import { createAuthMiddleware } from './middleware/auth-middleware.js';
import { injectDependencies } from './middleware/dependency-injection.js';
import { Container } from '../shared/container.js';

const app = new Hono();

// Global middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Allow frontend origins
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use('*', logger());

// Inject dependencies into all routes
app.use('*', injectDependencies());

// Apply auth middleware (optional auth for public routes)
const container = Container.getInstance();
app.use('*', createAuthMiddleware(container.jwtService));

// Mount route handlers
app.route('/api/albums', albums);
app.route('/api/auth', auth);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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
      auth: '/api/auth'
    }
  });
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Export individual route types for better type safety
const routes = app
  .route('/api/albums', albums)
  .route('/api/auth', auth);

export default app;
export type AppType = typeof routes;