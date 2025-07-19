import { serve } from '@hono/node-server';
import app from './presentation/app.js';

const port = Number(process.env.PORT) || 3001;

console.log(`🔥 Photo Map API Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port: port,
});

console.log(`✅ Server is running on http://localhost:${port}`);
console.log(`📚 API Documentation available at http://localhost:${port}`);
console.log(`🏥 Health check: http://localhost:${port}/health`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});