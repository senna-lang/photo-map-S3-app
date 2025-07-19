import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { signInSchema } from '../../schemas/index.js';
import { SignInUseCase } from '../../application/use-cases/auth/sign-in-use-case.js';
import { GetCurrentUserUseCase } from '../../application/use-cases/auth/get-current-user-use-case.js';
import { GitHubOAuthService } from '../../infrastructure/auth/github-oauth-service.js';
import { UserId } from '../../domain/value-objects/ids.js';

type Variables = {
  userId?: string;
};

const auth = new Hono<{ Variables: Variables }>();

// GET /auth/github - Get GitHub OAuth URL
auth.get('/github', async (c) => {
  try {
    const githubOAuthService = c.get('githubOAuthService') as GitHubOAuthService;
    const authUrl = githubOAuthService.getAuthorizationUrl();
    
    return c.json({ authUrl });
  } catch (error) {
    return c.json({ error: 'Failed to generate auth URL' }, 500);
  }
});

// POST /auth/signin - Sign in with GitHub code
auth.post(
  '/signin',
  zValidator('json', signInSchema),
  async (c) => {
    try {
      const signInUseCase = c.get('signInUseCase') as SignInUseCase;
      const { code } = c.req.valid('json');
      
      const result = await signInUseCase.execute(code);
      
      if (result.isErr()) {
        return c.json({ error: result.error.message }, 400);
      }

      return c.json(result.value);
    } catch (error) {
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// GET /auth/me - Get current user (requires authentication)
auth.get('/me', async (c) => {
  try {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const userIdResult = UserId.create(userId);
    if (userIdResult.isErr()) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }

    const getCurrentUserUseCase = c.get('getCurrentUserUseCase') as GetCurrentUserUseCase;
    
    const result = await getCurrentUserUseCase.execute(userIdResult.value);
    
    if (result.isErr()) {
      const statusCode = result.error.message.includes('not found') ? 404 : 500;
      return c.json({ error: result.error.message }, statusCode);
    }

    return c.json(result.value);
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /auth/signout - Sign out (requires authentication)
auth.post('/signout', async (c) => {
  try {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // For JWT-based auth, signout is typically handled client-side
    // by removing the token. Server-side, we could maintain a blacklist
    // but for simplicity, we'll just return success
    return c.json({ message: 'Signed out successfully' });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { auth };
export type AuthApp = typeof auth;