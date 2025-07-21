/**
 * Userエンティティのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { User } from './user';
import { EntityValidationError } from '../errors';

describe('User', () => {
  describe('create', () => {
    it('正常なデータでユーザーが作成される', () => {
      const result = User.create(
        '12345',
        'testuser',
        'https://github.com/testuser.png',
        'Test User'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.value;
        expect(user.githubId).toBe('12345');
        expect(user.username).toBe('testuser');
        expect(user.avatarUrl).toBe('https://github.com/testuser.png');
        expect(user.name).toBe('Test User');
        expect(user.displayName).toBe('Test User');
      }
    });

    it('最小限のデータでユーザーが作成される', () => {
      const result = User.create('12345', 'testuser');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.value;
        expect(user.githubId).toBe('12345');
        expect(user.username).toBe('testuser');
        expect(user.avatarUrl).toBeNull();
        expect(user.name).toBeNull();
        expect(user.displayName).toBe('testuser'); // nameがnullの場合はusernameが使われる
      }
    });

    it('GitHubIDが空の場合エラーになる', () => {
      const result = User.create('', 'testuser');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityValidationError);
        expect(result.error.message).toContain('GitHub ID is required');
      }
    });

    it('ユーザー名が空の場合エラーになる', () => {
      const result = User.create('12345', '');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityValidationError);
        expect(result.error.message).toContain('Username is required');
      }
    });

    it('ユーザー名が39文字を超える場合エラーになる', () => {
      const longUsername = 'a'.repeat(40);
      const result = User.create('12345', longUsername);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityValidationError);
        expect(result.error.message).toContain('Username must be 39 characters or less');
      }
    });

    it('ユーザー名に無効な文字が含まれる場合エラーになる', () => {
      const invalidUsernames = [
        'user@name',
        'user name',
        'user.name',
        'user#name',
        'user_name'
      ];

      invalidUsernames.forEach(username => {
        const result = User.create('12345', username);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error).toBeInstanceOf(EntityValidationError);
          expect(result.error.message).toContain('Username can only contain alphanumeric characters and hyphens');
        }
      });
    });

    it('有効なユーザー名パターンが受け入れられる', () => {
      const validUsernames = [
        'testuser',
        'test-user',
        'test123',
        'TEST-USER',
        'a',
        '123'
      ];

      validUsernames.forEach(username => {
        const result = User.create('12345', username);
        expect(result.isOk()).toBe(true);
      });
    });

    it('無効なアバターURLの場合エラーになる', () => {
      const result = User.create('12345', 'testuser', 'invalid-url');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityValidationError);
        expect(result.error.message).toContain('Invalid avatar URL format');
      }
    });

    it('作成時にIDが自動生成される', () => {
      const result = User.create('12345', 'testuser');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id.value).toBeDefined();
        expect(result.value.id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      }
    });
  });

  describe('updateProfile', () => {
    let user: User;

    beforeEach(() => {
      const result = User.create('12345', 'testuser', 'https://github.com/testuser.png', 'Test User');
      if (result.isErr()) throw result.error;
      user = result.value;
    });

    it('ユーザー名を更新できる', () => {
      const result = user.updateProfile('newusername');

      expect(result.isOk()).toBe(true);
      expect(user.username).toBe('newusername');
    });

    it('アバターURLを更新できる', () => {
      const newAvatarUrl = 'https://example.com/new-avatar.png';
      const result = user.updateProfile(undefined, newAvatarUrl);

      expect(result.isOk()).toBe(true);
      expect(user.avatarUrl).toBe(newAvatarUrl);
    });

    it('名前を更新できる', () => {
      const result = user.updateProfile(undefined, undefined, 'New Name');

      expect(result.isOk()).toBe(true);
      expect(user.name).toBe('New Name');
    });

    it('空文字でアバターURLをクリアできる', () => {
      const result = user.updateProfile(undefined, '');

      expect(result.isOk()).toBe(true);
      expect(user.avatarUrl).toBeNull();
    });

    it('空文字で名前をクリアできる', () => {
      const result = user.updateProfile(undefined, undefined, '');

      expect(result.isOk()).toBe(true);
      expect(user.name).toBeNull();
    });

    it('無効なユーザー名では更新できない', () => {
      const result = user.updateProfile('invalid@username');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityValidationError);
        expect(result.error.message).toContain('Username can only contain alphanumeric characters and hyphens');
      }
    });

    it('無効なアバターURLでは更新できない', () => {
      const result = user.updateProfile(undefined, 'invalid-url');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityValidationError);
        expect(result.error.message).toContain('Invalid avatar URL format');
      }
    });
  });

  describe('displayName', () => {
    it('名前が設定されている場合は名前を返す', () => {
      const result = User.create('12345', 'testuser', undefined, 'Test User');
      if (result.isErr()) throw result.error;
      const user = result.value;
      expect(user.displayName).toBe('Test User');
    });

    it('名前が設定されていない場合はユーザー名を返す', () => {
      const result = User.create('12345', 'testuser');
      if (result.isErr()) throw result.error;
      const user = result.value;
      expect(user.displayName).toBe('testuser');
    });
  });

  describe('equals', () => {
    it('同じIDのユーザーの場合trueを返す', () => {
      const user1Result = User.create('12345', 'testuser');
      if (user1Result.isErr()) throw user1Result.error;
      const user1 = user1Result.value;
      const user2 = User.reconstruct(
        user1.id,
        '12345',
        'testuser',
        null,
        null,
        user1.createdAt,
        user1.updatedAt
      );

      expect(user1.equals(user2)).toBe(true);
    });

    it('異なるIDのユーザーの場合falseを返す', () => {
      const user1Result = User.create('12345', 'testuser1');
      if (user1Result.isErr()) throw user1Result.error;
      const user1 = user1Result.value;
      const user2Result = User.create('67890', 'testuser2');
      if (user2Result.isErr()) throw user2Result.error;
      const user2 = user2Result.value;

      expect(user1.equals(user2)).toBe(false);
    });
  });

  describe('isSameGitHubUser', () => {
    it('同じGitHubIDの場合trueを返す', () => {
      const result = User.create('12345', 'testuser');
      if (result.isErr()) throw result.error;
      const user = result.value;
      expect(user.isSameGitHubUser('12345')).toBe(true);
    });

    it('異なるGitHubIDの場合falseを返す', () => {
      const result = User.create('12345', 'testuser');
      if (result.isErr()) throw result.error;
      const user = result.value;
      expect(user.isSameGitHubUser('67890')).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('正しいJSON形式を返す', () => {
      const userResult = User.create('12345', 'testuser', 'https://github.com/testuser.png', 'Test User');
      if (userResult.isErr()) throw userResult.error;
      const user = userResult.value;
      const json = user.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('githubId', '12345');
      expect(json).toHaveProperty('username', 'testuser');
      expect(json).toHaveProperty('avatarUrl', 'https://github.com/testuser.png');
      expect(json).toHaveProperty('name', 'Test User');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });

    it('nullフィールドを含む正しいJSON形式を返す', () => {
      const result = User.create('12345', 'testuser');
      if (result.isErr()) throw result.error;
      const user = result.value;
      const json = user.toJSON();

      expect(json.avatarUrl).toBeNull();
      expect(json.name).toBeNull();
    });
  });
});