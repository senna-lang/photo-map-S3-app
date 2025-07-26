/**
 * DrizzleAlbumRepositoryの統合テスト
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { DrizzleAlbumRepository } from './drizzle-album-repository';
import { DrizzleUserRepository } from './drizzle-user-repository';
import {
  createTestDb,
  clearTestDb,
  createTestUser,
  createTestAlbum,
  createTestUserId,
} from './test-helpers';
import { EntityNotFoundError } from '../../domain/errors';

describe('DrizzleAlbumRepository', () => {
  const db = createTestDb();
  const albumRepository = new DrizzleAlbumRepository(db);
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
    it('新しいアルバムを保存できる', async () => {
      // テストユーザーを先に保存
      const user = createTestUser();
      const saveUserResult = await userRepository.save(user);
      expect(saveUserResult.isOk()).toBe(true);

      // アルバムを保存
      const album = createTestAlbum(user.id);
      const result = await albumRepository.save(album);

      expect(result.isOk()).toBe(true);
    });

    it('既存のアルバムを更新できる', async () => {
      // テストユーザーとアルバムを準備
      const user = createTestUser();
      await userRepository.save(user);

      const album = createTestAlbum(user.id);
      await albumRepository.save(album);

      // アルバムに画像を追加して再保存
      const newImageUrl = await import('../../domain/value-objects').then((m) =>
        m.ImageUrl.create('https://example.com/new-image.jpg')
      );

      if (newImageUrl.isErr()) throw newImageUrl.error;

      const addResult = album.addImage(newImageUrl.value, user.id);
      expect(addResult.isOk()).toBe(true);

      const saveResult = await albumRepository.save(album);
      expect(saveResult.isOk()).toBe(true);

      // 更新されたアルバムを取得して検証
      const findResult = await albumRepository.findById(album.id);
      expect(findResult.isOk()).toBe(true);

      if (findResult.isOk() && findResult.value) {
        expect(findResult.value.imageCount).toBe(2);
      }
    });
  });

  describe('findById', () => {
    it('存在するアルバムを取得できる', async () => {
      // テストデータを準備
      const user = createTestUser();
      await userRepository.save(user);

      const album = createTestAlbum(user.id);
      await albumRepository.save(album);

      // IDで検索
      const result = await albumRepository.findById(album.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).not.toBeNull();
        expect(result.value?.id.equals(album.id)).toBe(true);
        expect(result.value?.userId.equals(user.id)).toBe(true);
      }
    });

    it('存在しないアルバムの場合nullを返す', async () => {
      const nonExistentId = createTestUserId();
      const { AlbumId } = await import('../../domain/value-objects');
      const albumIdResult = AlbumId.create(nonExistentId.value);

      if (albumIdResult.isErr()) throw albumIdResult.error;

      const result = await albumRepository.findById(albumIdResult.value);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('findByUserId', () => {
    it('ユーザーのアルバムを全て取得できる', async () => {
      // テストユーザーを準備
      const user = createTestUser();
      await userRepository.save(user);

      // 複数のアルバムを作成
      const album1 = createTestAlbum(user.id, {
        latitude: 35.6762,
        longitude: 139.6503,
      });
      const album2 = createTestAlbum(user.id, {
        latitude: 34.6937,
        longitude: 135.5023,
      });

      await albumRepository.save(album1);
      await albumRepository.save(album2);

      // ユーザーIDで検索
      const result = await albumRepository.findByUserId(user.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value.some((a) => a.id.equals(album1.id))).toBe(true);
        expect(result.value.some((a) => a.id.equals(album2.id))).toBe(true);
      }
    });

    it('アルバムが存在しないユーザーの場合空配列を返す', async () => {
      const nonExistentUserId = createTestUserId();

      const result = await albumRepository.findByUserId(nonExistentUserId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('findAll', () => {
    it('全てのアルバムを取得できる', async () => {
      // 複数のユーザーとアルバムを準備
      const user1 = createTestUser({ githubId: '11111', username: 'user1' });
      const user2 = createTestUser({ githubId: '22222', username: 'user2' });

      await userRepository.save(user1);
      await userRepository.save(user2);

      const album1 = createTestAlbum(user1.id);
      const album2 = createTestAlbum(user2.id);

      await albumRepository.save(album1);
      await albumRepository.save(album2);

      // 全アルバムを取得
      const result = await albumRepository.findAll();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
      }
    });
  });

  describe('delete', () => {
    it('存在するアルバムを削除できる', async () => {
      // テストデータを準備
      const user = createTestUser();
      await userRepository.save(user);

      const album = createTestAlbum(user.id);
      await albumRepository.save(album);

      // 削除実行
      const deleteResult = await albumRepository.delete(album.id);
      expect(deleteResult.isOk()).toBe(true);

      // 削除後に取得できないことを確認
      const findResult = await albumRepository.findById(album.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it('存在しないアルバムを削除しようとするとEntityNotFoundErrorになる', async () => {
      const nonExistentId = createTestUserId();
      const { AlbumId } = await import('../../domain/value-objects');
      const albumIdResult = AlbumId.create(nonExistentId.value);

      if (albumIdResult.isErr()) throw albumIdResult.error;

      const result = await albumRepository.delete(albumIdResult.value);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityNotFoundError);
      }
    });
  });

  describe('exists', () => {
    it('存在するアルバムに対してtrueを返す', async () => {
      // テストデータを準備
      const user = createTestUser();
      await userRepository.save(user);

      const album = createTestAlbum(user.id);
      await albumRepository.save(album);

      // 存在確認
      const result = await albumRepository.exists(album.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it('存在しないアルバムに対してfalseを返す', async () => {
      const nonExistentId = createTestUserId();
      const { AlbumId } = await import('../../domain/value-objects');
      const albumIdResult = AlbumId.create(nonExistentId.value);

      if (albumIdResult.isErr()) throw albumIdResult.error;

      const result = await albumRepository.exists(albumIdResult.value);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('countByUserId', () => {
    it('ユーザーのアルバム数を正しく返す', async () => {
      // テストユーザーを準備
      const user = createTestUser();
      await userRepository.save(user);

      // 3つのアルバムを作成
      for (let i = 0; i < 3; i++) {
        const album = createTestAlbum(user.id, {
          imageUrls: [`https://example.com/image${i}.jpg`],
        });
        await albumRepository.save(album);
      }

      // カウント取得
      const result = await albumRepository.countByUserId(user.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(3);
      }
    });

    it('アルバムが存在しないユーザーに対して0を返す', async () => {
      const nonExistentUserId = createTestUserId();

      const result = await albumRepository.countByUserId(nonExistentUserId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(0);
      }
    });
  });
});
