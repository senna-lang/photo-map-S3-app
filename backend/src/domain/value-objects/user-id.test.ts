/**
 * UserIdクラスのテスト
 */

import { describe, it, expect } from 'vitest';
import { UserId } from './user-id';
import { ValidationError } from '../errors';

describe('UserId', () => {
  describe('create', () => {
    it('正常なUUIDで作成される', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = UserId.create(validUuid);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(validUuid);
      }
    });

    it('小文字のUUIDで作成される', () => {
      const validUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = UserId.create(validUuid);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(validUuid);
      }
    });

    it('大文字のUUIDで作成される', () => {
      const validUuid = 'F47AC10B-58CC-4372-A567-0E02B2C3D479';
      const result = UserId.create(validUuid);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(validUuid);
      }
    });

    it('無効なUUID形式の場合エラーになる', () => {
      const invalidUuids = [
        'invalid-uuid',
        '123e4567-e89b-12d3-a456', // 短すぎる
        '123e4567-e89b-12d3-a456-426614174000-extra', // 長すぎる
        '123e4567-e89b-12d3-a456-42661417400g', // 無効な文字
        '', // 空文字
        'not-a-uuid-at-all',
      ];

      invalidUuids.forEach((uuid) => {
        const result = UserId.create(uuid);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error).toBeInstanceOf(ValidationError);
          expect(result.error.message).toContain(
            'Invalid UUID format for UserId'
          );
        }
      });
    });
  });

  describe('generate', () => {
    it('有効なUUIDを生成する', () => {
      const userId = UserId.generate();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuidRegex.test(userId.value)).toBe(true);
    });

    it('毎回異なるUUIDを生成する', () => {
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();

      expect(userId1.equals(userId2)).toBe(false);
    });

    it('生成されたUUIDはバージョン4である', () => {
      const userId = UserId.generate();
      const parts = userId.value.split('-');

      // UUIDv4の特徴：3番目のセクションの最初の文字が4
      expect(parts[2][0]).toBe('4');
    });
  });

  describe('equals', () => {
    it('同じUUIDの場合trueを返す', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId1Result = UserId.create(uuid);
      if (userId1Result.isErr()) throw userId1Result.error;
      const userId1 = userId1Result.value;
      const userId2Result = UserId.create(uuid);
      if (userId2Result.isErr()) throw userId2Result.error;
      const userId2 = userId2Result.value;

      expect(userId1.equals(userId2)).toBe(true);
    });

    it('異なるUUIDの場合falseを返す', () => {
      const userId1Result = UserId.create(
        '123e4567-e89b-12d3-a456-426614174000'
      );
      if (userId1Result.isErr()) throw userId1Result.error;
      const userId1 = userId1Result.value;
      const userId2Result = UserId.create(
        'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      );
      if (userId2Result.isErr()) throw userId2Result.error;
      const userId2 = userId2Result.value;

      expect(userId1.equals(userId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('UUIDの文字列表現を返す', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const userIdResult = UserId.create(uuid);
      if (userIdResult.isErr()) throw userIdResult.error;
      const userId = userIdResult.value;

      expect(userId.toString()).toBe(uuid);
    });
  });

  describe('toJSON', () => {
    it('UUID文字列を返す', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const userIdResult = UserId.create(uuid);
      if (userIdResult.isErr()) throw userIdResult.error;
      const userId = userIdResult.value;

      expect(userId.toJSON()).toBe(uuid);
    });
  });
});
