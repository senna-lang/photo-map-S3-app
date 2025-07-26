/**
 * JwtServiceのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JwtService } from './jwt-service';
import { UserId } from '../../domain/value-objects';

describe('JwtService', () => {
  let jwtService: JwtService;
  let testUserId: UserId;

  beforeEach(() => {
    jwtService = new JwtService({
      secret: 'test-secret',
      expiresIn: '1h',
    });
    testUserId = UserId.generate();
  });

  describe('generateToken', () => {
    it('正常にトークンを生成する', () => {
      const result = jwtService.generateToken(testUserId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(typeof result.value).toBe('string');
        expect(result.value.length).toBeGreaterThan(0);
      }
    });
  });

  describe('verifyToken', () => {
    it('正常なトークンを検証する', () => {
      const tokenResult = jwtService.generateToken(testUserId);
      expect(tokenResult.isOk()).toBe(true);

      if (tokenResult.isOk()) {
        const verifyResult = jwtService.verifyToken(tokenResult.value);

        expect(verifyResult.isOk()).toBe(true);
        if (verifyResult.isOk()) {
          expect(verifyResult.value.userId).toBe(testUserId.value);
          expect(verifyResult.value.iat).toBeDefined();
          expect(verifyResult.value.exp).toBeDefined();
        }
      }
    });

    it('無効なトークンでエラーになる', () => {
      const result = jwtService.verifyToken('invalid-token');

      expect(result.isErr()).toBe(true);
    });

    it('異なる秘密鍵で署名されたトークンでエラーになる', () => {
      const otherJwtService = new JwtService({
        secret: 'different-secret',
        expiresIn: '1h',
      });

      const tokenResult = otherJwtService.generateToken(testUserId);
      expect(tokenResult.isOk()).toBe(true);

      if (tokenResult.isOk()) {
        const verifyResult = jwtService.verifyToken(tokenResult.value);
        expect(verifyResult.isErr()).toBe(true);
      }
    });
  });

  describe('isTokenExpired', () => {
    it('有効期限内のトークンで false を返す', () => {
      const payload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後
      };

      const result = jwtService.isTokenExpired(payload);
      expect(result).toBe(false);
    });

    it('有効期限切れのトークンで true を返す', () => {
      const payload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000) - 3600, // 1時間前
        exp: Math.floor(Date.now() / 1000) - 1, // 1秒前
      };

      const result = jwtService.isTokenExpired(payload);
      expect(result).toBe(true);
    });

    it('expが未定義の場合 false を返す', () => {
      const payload = {
        userId: testUserId.value,
        iat: Math.floor(Date.now() / 1000),
      };

      const result = jwtService.isTokenExpired(payload);
      expect(result).toBe(false);
    });
  });
});
