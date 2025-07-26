/**
 * DrizzleUserRepositoryの統合テスト
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { DrizzleUserRepository } from './drizzle-user-repository';
import {
  createTestDb,
  clearTestDb,
  createTestUser,
  createTestUserId,
} from './test-helpers';
import { EntityNotFoundError } from '../../domain/errors';

describe('DrizzleUserRepository', () => {
  const db = createTestDb();
  const userRepository = new DrizzleUserRepository(db);

  beforeEach(async () => {
    await clearTestDb(db);
  });

  afterAll(async () => {
    await clearTestDb(db);
    // @ts-ignore - テスト終了時にDB接続をクローズ
    await db.$client?.end();
  });

  describe('save', () => {
    it('新しいユーザーを保存できる', async () => {
      const user = createTestUser();
      const result = await userRepository.save(user);

      expect(result.isOk()).toBe(true);
    });

    it('既存のユーザーを更新できる', async () => {
      // ユーザーを保存
      const user = createTestUser();
      await userRepository.save(user);

      // プロフィールを更新
      const updateResult = user.updateProfile(
        'new-username',
        'https://example.com/new-avatar.png',
        'New Name'
      );
      expect(updateResult.isOk()).toBe(true);

      // 更新されたユーザーを保存
      const saveResult = await userRepository.save(user);
      expect(saveResult.isOk()).toBe(true);

      // 更新されたユーザーを取得して検証
      const findResult = await userRepository.findById(user.id);
      expect(findResult.isOk()).toBe(true);

      if (findResult.isOk() && findResult.value) {
        expect(findResult.value.username).toBe('new-username');
        expect(findResult.value.name).toBe('New Name');
      }
    });
  });

  describe('findById', () => {
    it('存在するユーザーを取得できる', async () => {
      // テストユーザーを保存
      const user = createTestUser();
      await userRepository.save(user);

      // IDで検索
      const result = await userRepository.findById(user.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).not.toBeNull();
        expect(result.value?.id.equals(user.id)).toBe(true);
        expect(result.value?.githubId).toBe(user.githubId);
        expect(result.value?.username).toBe(user.username);
      }
    });

    it('存在しないユーザーの場合nullを返す', async () => {
      const nonExistentId = createTestUserId();

      const result = await userRepository.findById(nonExistentId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('findByGitHubId', () => {
    it('存在するGitHubIDでユーザーを取得できる', async () => {
      const user = createTestUser({ githubId: 'unique-github-id' });
      await userRepository.save(user);

      const result = await userRepository.findByGitHubId('unique-github-id');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).not.toBeNull();
        expect(result.value?.githubId).toBe('unique-github-id');
        expect(result.value?.id.equals(user.id)).toBe(true);
      }
    });

    it('存在しないGitHubIDの場合nullを返す', async () => {
      const result = await userRepository.findByGitHubId(
        'non-existent-github-id'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('findByUsername', () => {
    it('存在するユーザー名でユーザーを取得できる', async () => {
      const user = createTestUser({ username: 'unique-username' });
      await userRepository.save(user);

      const result = await userRepository.findByUsername('unique-username');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).not.toBeNull();
        expect(result.value?.username).toBe('unique-username');
        expect(result.value?.id.equals(user.id)).toBe(true);
      }
    });

    it('存在しないユーザー名の場合nullを返す', async () => {
      const result = await userRepository.findByUsername(
        'non-existent-username'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('delete', () => {
    it('存在するユーザーを削除できる', async () => {
      // テストユーザーを保存
      const user = createTestUser();
      await userRepository.save(user);

      // 削除実行
      const deleteResult = await userRepository.delete(user.id);
      expect(deleteResult.isOk()).toBe(true);

      // 削除後に取得できないことを確認
      const findResult = await userRepository.findById(user.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it('存在しないユーザーを削除しようとするとEntityNotFoundErrorになる', async () => {
      const nonExistentId = createTestUserId();

      const result = await userRepository.delete(nonExistentId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityNotFoundError);
      }
    });
  });

  describe('exists', () => {
    it('存在するユーザーに対してtrueを返す', async () => {
      const user = createTestUser();
      await userRepository.save(user);

      const result = await userRepository.exists(user.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it('存在しないユーザーに対してfalseを返す', async () => {
      const nonExistentId = createTestUserId();

      const result = await userRepository.exists(nonExistentId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('existsByGitHubId', () => {
    it('存在するGitHubIDに対してtrueを返す', async () => {
      const user = createTestUser({ githubId: 'existing-github-id' });
      await userRepository.save(user);

      const result =
        await userRepository.existsByGitHubId('existing-github-id');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it('存在しないGitHubIDに対してfalseを返す', async () => {
      const result = await userRepository.existsByGitHubId(
        'non-existent-github-id'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('GitHub OAuth integration scenarios', () => {
    it('GitHubユーザーの初回ログイン時の流れ', async () => {
      const githubId = 'new-github-user';
      const username = 'newuser';

      // 1. GitHubIDでユーザーが存在するかチェック
      const existsResult = await userRepository.existsByGitHubId(githubId);
      expect(existsResult.isOk() && existsResult.value).toBe(false);

      // 2. 新しいユーザーを作成して保存
      const user = createTestUser({ githubId, username });
      const saveResult = await userRepository.save(user);
      expect(saveResult.isOk()).toBe(true);

      // 3. GitHubIDで再度検索して取得できることを確認
      const findResult = await userRepository.findByGitHubId(githubId);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value?.githubId).toBe(githubId);
        expect(findResult.value?.username).toBe(username);
      }
    });

    it('既存GitHubユーザーのプロフィール同期', async () => {
      const githubId = 'existing-user';

      // 1. 既存ユーザーを保存
      const user = createTestUser({
        githubId,
        username: 'oldusername',
        name: 'Old Name',
      });
      await userRepository.save(user);

      // 2. GitHubから最新プロフィール情報を取得したと仮定してプロフィール更新
      const updateResult = user.updateProfile(
        'newusername',
        'https://github.com/newusername.png',
        'New Name'
      );
      expect(updateResult.isOk()).toBe(true);

      // 3. 更新されたプロフィールを保存
      const saveResult = await userRepository.save(user);
      expect(saveResult.isOk()).toBe(true);

      // 4. 更新されたプロフィールが正しく保存されていることを確認
      const findResult = await userRepository.findByGitHubId(githubId);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk() && findResult.value) {
        expect(findResult.value.username).toBe('newusername');
        expect(findResult.value.name).toBe('New Name');
      }
    });
  });
});
