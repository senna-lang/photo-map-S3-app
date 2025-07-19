import { Context, Next } from 'hono';
import { JwtService } from '../../infrastructure/auth/jwt-service.js';

export function createAuthMiddleware(jwtService: JwtService) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For optional auth, continue without setting userId
      await next();
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const userIdResult = jwtService.extractUserIdFromToken(token);
    
    if (userIdResult.isErr()) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Set userId in context for use in route handlers
    c.set('userId', userIdResult.value.value);
    await next();
  };
}

export function requireAuth() {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    await next();
  };
}