/**
 * AuthMiddlewareのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { requireAuth, optionalAuth } from './auth-middleware';
import { JwtService } from '../../infrastructure/auth';
import { UserId } from '../../domain/value-objects';
import { ok, err } from 'neverthrow';

describe('AuthMiddleware', () => {
  let app: Hono;
  let mockJwtService: JwtService;
  let testUserId: UserId;

  beforeEach(() => {
    mockJwtService = {
      generateToken: vi.fn(),
      verifyToken: vi.fn(),
      isTokenExpired: vi.fn(),
    } as any;

    testUserId = UserId.generate();
    app = new Hono();
  });

  describe('requireAuth', () => {
    beforeEach(() => {
      app.use('/protected/*', requireAuth(mockJwtService));
      app.get('/protected/test', (c) => {
        const user = c.get('user');
        return c.json({ userId: user?.userId.value });
      });
    });

    it('有効なトークンで認証が成功する', async () => {
      const mockPayload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      vi.mocked(mockJwtService.verifyToken).mockReturnValue(ok(mockPayload));
      vi.mocked(mockJwtService.isTokenExpired).mockReturnValue(false);

      const response = await app.request('/protected/test', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.userId).toBe(testUserId.value);
    });

    it('Authorizationヘッダーがない場合401エラー', async () => {
      const response = await app.request('/protected/test');

      expect(response.status).toBe(401);
      const data = (await response.json()) as any;
      expect(data.error).toBe('Authorization header is required');
    });

    it('Bearer形式でない場合401エラー', async () => {
      const response = await app.request('/protected/test', {
        headers: {
          Authorization: 'Basic dGVzdA==',
        },
      });

      expect(response.status).toBe(401);
      const data = (await response.json()) as any;
      expect(data.error).toBe('Authorization header is required');
    });

    it('無効なトークンで401エラー', async () => {
      vi.mocked(mockJwtService.verifyToken).mockReturnValue(
        err(new Error('Invalid token'))
      );

      const response = await app.request('/protected/test', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
      const data = (await response.json()) as any;
      expect(data.error).toBe('Invalid token');
    });

    it('期限切れトークンで401エラー', async () => {
      const expiredPayload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      };

      vi.mocked(mockJwtService.verifyToken).mockReturnValue(ok(expiredPayload));
      vi.mocked(mockJwtService.isTokenExpired).mockReturnValue(true);

      const response = await app.request('/protected/test', {
        headers: {
          Authorization: 'Bearer expired-token',
        },
      });

      expect(response.status).toBe(401);
      const data = (await response.json()) as any;
      expect(data.error).toBe('Token has expired');
    });

    it('無効なユーザーIDで401エラー', async () => {
      const invalidPayload = {
        userId: 'invalid-user-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      vi.mocked(mockJwtService.verifyToken).mockReturnValue(ok(invalidPayload));
      vi.mocked(mockJwtService.isTokenExpired).mockReturnValue(false);

      const response = await app.request('/protected/test', {
        headers: {
          Authorization: 'Bearer token-with-invalid-user-id',
        },
      });

      expect(response.status).toBe(401);
      const data = (await response.json()) as any;
      expect(data.error).toBe('Invalid user ID in token');
    });
  });

  describe('optionalAuth', () => {
    beforeEach(() => {
      app.use('/optional/*', optionalAuth(mockJwtService));
      app.get('/optional/test', (c) => {
        const user = c.get('user');
        return c.json({
          authenticated: !!user,
          userId: user?.userId.value,
        });
      });
    });

    it('有効なトークンでユーザー情報が設定される', async () => {
      const mockPayload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      vi.mocked(mockJwtService.verifyToken).mockReturnValue(ok(mockPayload));
      vi.mocked(mockJwtService.isTokenExpired).mockReturnValue(false);

      const response = await app.request('/optional/test', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.authenticated).toBe(true);
      expect(data.userId).toBe(testUserId.value);
    });

    it('Authorizationヘッダーがなくても正常処理される', async () => {
      const response = await app.request('/optional/test');

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.authenticated).toBe(false);
      expect(data.userId).toBeUndefined();
    });

    it('無効なトークンでもエラーにならない', async () => {
      vi.mocked(mockJwtService.verifyToken).mockReturnValue(
        err(new Error('Invalid token'))
      );

      const response = await app.request('/optional/test', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.authenticated).toBe(false);
      expect(data.userId).toBeUndefined();
    });

    it('期限切れトークンでもエラーにならない', async () => {
      const expiredPayload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      };

      vi.mocked(mockJwtService.verifyToken).mockReturnValue(ok(expiredPayload));
      vi.mocked(mockJwtService.isTokenExpired).mockReturnValue(true);

      const response = await app.request('/optional/test', {
        headers: {
          Authorization: 'Bearer expired-token',
        },
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.authenticated).toBe(false);
      expect(data.userId).toBeUndefined();
    });
  });
});
