/**
 * LoginWithGitHubUseCaseのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginWithGitHubUseCase } from './login-with-github-use-case';
import { User } from '../../../domain/entities';
import { UserRepository } from '../../../domain/repositories';
import { GitHubOAuthService, JwtService } from '../../../infrastructure/auth';
import { ok, err } from 'neverthrow';

describe('LoginWithGitHubUseCase', () => {
  let useCase: LoginWithGitHubUseCase;
  let mockUserRepository: UserRepository;
  let mockGitHubService: GitHubOAuthService;
  let mockJwtService: JwtService;

  beforeEach(() => {
    mockUserRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByGitHubId: vi.fn(),
      findByUsername: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      existsByGitHubId: vi.fn(),
    };

    mockGitHubService = {
      generateAuthUrl: vi.fn(),
      exchangeCodeForToken: vi.fn(),
      getUserInfo: vi.fn(),
      authenticate: vi.fn(),
    } as any;

    mockJwtService = {
      generateToken: vi.fn(),
      verifyToken: vi.fn(),
      isTokenExpired: vi.fn(),
    } as any;

    useCase = new LoginWithGitHubUseCase(
      mockUserRepository,
      mockGitHubService,
      mockJwtService
    );
  });

  describe('execute', () => {
    const mockGitHubUser = {
      id: '12345',
      login: 'testuser',
      avatar_url: 'https://github.com/avatar.jpg',
      name: 'Test User',
      email: 'test@example.com',
    };

    const mockRequest = {
      code: 'test-code',
      state: 'test-state',
    };

    it('新規ユーザーでログインが成功する', async () => {
      // GitHub認証成功
      vi.mocked(mockGitHubService.authenticate).mockResolvedValue(
        ok(mockGitHubUser)
      );

      // 既存ユーザーなし
      vi.mocked(mockUserRepository.findByGitHubId).mockResolvedValue(ok(null));

      // ユーザー保存成功
      vi.mocked(mockUserRepository.save).mockResolvedValue(ok(undefined));

      // JWT生成成功
      vi.mocked(mockJwtService.generateToken).mockReturnValue(ok('test-token'));

      const result = await useCase.execute(mockRequest);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.isNewUser).toBe(true);
        expect(result.value.token).toBe('test-token');
        expect(result.value.user.githubId).toBe(mockGitHubUser.id);
        expect(result.value.user.username).toBe(mockGitHubUser.login);
      }

      expect(mockUserRepository.save).toHaveBeenCalledOnce();
      expect(mockJwtService.generateToken).toHaveBeenCalledOnce();
    });

    it('既存ユーザーでログインが成功する', async () => {
      // 既存ユーザーを作成
      const existingUserResult = User.create(
        mockGitHubUser.id,
        'oldusername',
        'https://old-avatar.jpg',
        'Old Name'
      );
      expect(existingUserResult.isOk()).toBe(true);

      if (existingUserResult.isOk()) {
        const existingUser = existingUserResult.value;

        // GitHub認証成功
        vi.mocked(mockGitHubService.authenticate).mockResolvedValue(
          ok(mockGitHubUser)
        );

        // 既存ユーザーを返す
        vi.mocked(mockUserRepository.findByGitHubId).mockResolvedValue(
          ok(existingUser)
        );

        // ユーザー保存成功
        vi.mocked(mockUserRepository.save).mockResolvedValue(ok(undefined));

        // JWT生成成功
        vi.mocked(mockJwtService.generateToken).mockReturnValue(
          ok('test-token')
        );

        const result = await useCase.execute(mockRequest);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.isNewUser).toBe(false);
          expect(result.value.token).toBe('test-token');
          expect(result.value.user.username).toBe(mockGitHubUser.login); // 更新されている
        }
      }
    });

    it('GitHub認証に失敗した場合エラーになる', async () => {
      vi.mocked(mockGitHubService.authenticate).mockResolvedValue(
        err(new Error('GitHub auth failed'))
      );

      const result = await useCase.execute(mockRequest);

      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.findByGitHubId).not.toHaveBeenCalled();
    });

    it('ユーザー検索に失敗した場合エラーになる', async () => {
      vi.mocked(mockGitHubService.authenticate).mockResolvedValue(
        ok(mockGitHubUser)
      );
      vi.mocked(mockUserRepository.findByGitHubId).mockResolvedValue(
        err(new Error('Database error'))
      );

      const result = await useCase.execute(mockRequest);

      expect(result.isErr()).toBe(true);
    });

    it('ユーザー保存に失敗した場合エラーになる', async () => {
      vi.mocked(mockGitHubService.authenticate).mockResolvedValue(
        ok(mockGitHubUser)
      );
      vi.mocked(mockUserRepository.findByGitHubId).mockResolvedValue(ok(null));
      vi.mocked(mockUserRepository.save).mockResolvedValue(
        err(new Error('Save failed'))
      );

      const result = await useCase.execute(mockRequest);

      expect(result.isErr()).toBe(true);
    });

    it('JWT生成に失敗した場合エラーになる', async () => {
      vi.mocked(mockGitHubService.authenticate).mockResolvedValue(
        ok(mockGitHubUser)
      );
      vi.mocked(mockUserRepository.findByGitHubId).mockResolvedValue(ok(null));
      vi.mocked(mockUserRepository.save).mockResolvedValue(ok(undefined));
      vi.mocked(mockJwtService.generateToken).mockReturnValue(
        err(new Error('JWT generation failed'))
      );

      const result = await useCase.execute(mockRequest);

      expect(result.isErr()).toBe(true);
    });
  });
});
