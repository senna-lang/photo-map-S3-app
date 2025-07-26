/**
 * 認証関連のAPIルート
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  LoginWithGitHubUseCase,
  GetCurrentUserUseCase,
} from '../../application/use-cases/auth';
import { UserRepository } from '../../domain/repositories';
import { GitHubOAuthService, JwtService } from '../../infrastructure/auth';
import { requireAuth } from '../middleware';

// バリデーションスキーマ
const loginSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

export function createAuthRoutes(
  userRepository: UserRepository,
  gitHubService: GitHubOAuthService,
  jwtService: JwtService
) {
  const app = new Hono();

  // GitHub認証URL取得
  app.get('/github/url', (c) => {
    const state = c.req.query('state');
    const authUrl = gitHubService.generateAuthUrl(state);

    return c.json({
      authUrl,
      state,
    });
  });

  // GitHub OAuth コールバック
  app.post('/github/callback', zValidator('json', loginSchema), async (c) => {
    const { code, state } = c.req.valid('json');

    const loginUseCase = new LoginWithGitHubUseCase(
      userRepository,
      gitHubService,
      jwtService
    );

    const result = await loginUseCase.execute({ code, state });

    if (result.isErr()) {
      console.error('Login failed:', result.error);
      return c.json(
        {
          error: 'Authentication failed',
          message: result.error.message,
        },
        401
      );
    }

    const { user, token, isNewUser } = result.value;

    return c.json({
      user: user.toJSON(),
      token,
      isNewUser,
    });
  });

  // 現在のユーザー情報取得
  app.get('/me', requireAuth(jwtService), async (c) => {
    const authContext = c.get('user');
    if (!authContext) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const getCurrentUserUseCase = new GetCurrentUserUseCase(
      userRepository,
      jwtService
    );

    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization header is required' }, 401);
    }

    const token = authHeader.substring(7); // "Bearer " を除去

    const result = await getCurrentUserUseCase.execute({ token });

    if (result.isErr()) {
      console.error('Get current user failed:', result.error);
      return c.json(
        {
          error: 'Failed to get user information',
          message: result.error.message,
        },
        500
      );
    }

    return c.json({
      user: result.value.user.toJSON(),
    });
  });

  // ログアウト（クライアントサイドでトークンを削除するだけ）
  app.post('/logout', (c) => {
    return c.json({
      message: 'Logged out successfully',
    });
  });

  return app;
}
