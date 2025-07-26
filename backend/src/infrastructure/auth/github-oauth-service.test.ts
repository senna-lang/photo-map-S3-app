/**
 * GitHubOAuthServiceのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubOAuthService, GitHubConfig } from './github-oauth-service';

// fetchをモック
global.fetch = vi.fn();

describe('GitHubOAuthService', () => {
  let githubService: GitHubOAuthService;
  let config: GitHubConfig;

  beforeEach(() => {
    config = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
    };
    githubService = new GitHubOAuthService(config);
    vi.resetAllMocks();
  });

  describe('generateAuthUrl', () => {
    it('正しい認証URLを生成する', () => {
      const url = githubService.generateAuthUrl();

      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain(`client_id=${config.clientId}`);
      expect(url).toContain(
        `redirect_uri=${encodeURIComponent(config.redirectUri)}`
      );
      expect(url).toContain('scope=read%3Auser+user%3Aemail');
    });

    it('stateパラメータを含む認証URLを生成する', () => {
      const state = 'test-state';
      const url = githubService.generateAuthUrl(state);

      expect(url).toContain(`state=${state}`);
    });
  });

  describe('exchangeCodeForToken', () => {
    it('正常にアクセストークンを取得する', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'read:user,user:email',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await githubService.exchangeCodeForToken('test-code');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('test-access-token');
      }

      expect(fetch).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code: 'test-code',
            redirect_uri: config.redirectUri,
          }),
        })
      );
    });

    it('GitHubからエラーレスポンスを受けた場合エラーになる', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const result = await githubService.exchangeCodeForToken('invalid-code');

      expect(result.isErr()).toBe(true);
    });

    it('アクセストークンが含まれていない場合エラーになる', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await githubService.exchangeCodeForToken('test-code');

      expect(result.isErr()).toBe(true);
    });
  });

  describe('getUserInfo', () => {
    it('正常にユーザー情報を取得する', async () => {
      const mockUser = {
        id: '12345',
        login: 'testuser',
        avatar_url: 'https://github.com/avatar.jpg',
        name: 'Test User',
        email: 'test@example.com',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await githubService.getUserInfo('test-token');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockUser);
      }

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token',
            Accept: 'application/vnd.github.v3+json',
          },
        })
      );
    });

    it('必須フィールドが欠けている場合エラーになる', async () => {
      const mockUser = {
        // idとloginが欠けている
        avatar_url: 'https://github.com/avatar.jpg',
        name: 'Test User',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await githubService.getUserInfo('test-token');

      expect(result.isErr()).toBe(true);
    });
  });

  describe('authenticate', () => {
    it('完全な認証フローが正常に動作する', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'read:user,user:email',
      };

      const mockUser = {
        id: '12345',
        login: 'testuser',
        avatar_url: 'https://github.com/avatar.jpg',
        name: 'Test User',
        email: 'test@example.com',
      };

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUser),
        });

      const result = await githubService.authenticate('test-code');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockUser);
      }
    });

    it('トークン取得に失敗した場合エラーになる', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const result = await githubService.authenticate('invalid-code');

      expect(result.isErr()).toBe(true);
    });
  });
});
