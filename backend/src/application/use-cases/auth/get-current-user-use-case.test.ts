/**
 * GetCurrentUserUseCaseのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetCurrentUserUseCase } from './get-current-user-use-case';
import { User } from '../../../domain/entities';
import { UserId } from '../../../domain/value-objects';
import { UserRepository } from '../../../domain/repositories';
import { JwtService } from '../../../infrastructure/auth';
import { ok, err } from 'neverthrow';

describe('GetCurrentUserUseCase', () => {
  let useCase: GetCurrentUserUseCase;
  let mockUserRepository: UserRepository;
  let mockJwtService: JwtService;
  let testUser: User;
  let testUserId: UserId;

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

    mockJwtService = {
      generateToken: vi.fn(),
      verifyToken: vi.fn(),
      isTokenExpired: vi.fn(),
    } as any;

    useCase = new GetCurrentUserUseCase(mockUserRepository, mockJwtService);

    // テストユーザーを作成
    testUserId = UserId.generate();
    const userResult = User.create(
      '12345',
      'testuser',
      'https://avatar.jpg',
      'Test User'
    );
    expect(userResult.isOk()).toBe(true);
    if (userResult.isOk()) {
      testUser = userResult.value;
    }
  });

  describe('execute', () => {
    const mockRequest = {
      token: 'valid-jwt-token',
    };

    it('正常にユーザー情報を取得する', async () => {
      const mockPayload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // JWT検証成功
      vi.mocked(mockJwtService.verifyToken).mockReturnValue(ok(mockPayload));

      // トークン有効期限チェック
      vi.mocked(mockJwtService.isTokenExpired).mockReturnValue(false);

      // ユーザー取得成功
      vi.mocked(mockUserRepository.findById).mockResolvedValue(ok(testUser));

      const result = await useCase.execute(mockRequest);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.user).toBe(testUser);
      }

      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(
        mockRequest.token
      );
      expect(mockJwtService.isTokenExpired).toHaveBeenCalledWith(mockPayload);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: testUserId.value })
      );
    });

    it('無効なトークンでエラーになる', async () => {
      vi.mocked(mockJwtService.verifyToken).mockReturnValue(
        err(new Error('Invalid token'))
      );

      const result = await useCase.execute(mockRequest);

      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('期限切れトークンでエラーになる', async () => {
      const expiredPayload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      };

      vi.mocked(mockJwtService.verifyToken).mockReturnValue(ok(expiredPayload));
      vi.mocked(mockJwtService.isTokenExpired).mockReturnValue(true);

      const result = await useCase.execute(mockRequest);

      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('無効なユーザーIDでエラーになる', async () => {
      const invalidPayload = {
        userId: 'invalid-user-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      vi.mocked(mockJwtService.verifyToken).mockReturnValue(ok(invalidPayload));
      vi.mocked(mockJwtService.isTokenExpired).mockReturnValue(false);

      const result = await useCase.execute(mockRequest);

      expect(result.isErr()).toBe(true);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('ユーザーが見つからない場合エラーになる', async () => {
      const mockPayload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      vi.mocked(mockJwtService.verifyToken).mockReturnValue(ok(mockPayload));
      vi.mocked(mockJwtService.isTokenExpired).mockReturnValue(false);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(ok(null));

      const result = await useCase.execute(mockRequest);

      expect(result.isErr()).toBe(true);
    });

    it('データベースエラーでエラーになる', async () => {
      const mockPayload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      vi.mocked(mockJwtService.verifyToken).mockReturnValue(ok(mockPayload));
      vi.mocked(mockJwtService.isTokenExpired).mockReturnValue(false);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(
        err(new Error('Database error'))
      );

      const result = await useCase.execute(mockRequest);

      expect(result.isErr()).toBe(true);
    });
  });
});
