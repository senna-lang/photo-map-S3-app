/**
 * GetAlbumsUseCaseのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetAlbumsUseCase } from './get-albums-use-case';
import { Album } from '../../../domain/entities';
import {
  AlbumId,
  Coordinate,
  ImageUrl,
  UserId,
} from '../../../domain/value-objects';
import { AlbumRepository } from '../../../domain/repositories';
import { ok, err } from 'neverthrow';

describe('GetAlbumsUseCase', () => {
  let useCase: GetAlbumsUseCase;
  let mockAlbumRepository: AlbumRepository;
  let testAlbums: Album[];

  beforeEach(() => {
    mockAlbumRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      countByUserId: vi.fn(),
    };

    useCase = new GetAlbumsUseCase(mockAlbumRepository);

    // テスト用アルバムを作成
    const coordinate1Result = Coordinate.create(35.6762, 139.6503);
    const coordinate2Result = Coordinate.create(35.6895, 139.6917);
    const imageUrl1Result = ImageUrl.create('https://example.com/image1.jpg');
    const imageUrl2Result = ImageUrl.create('https://example.com/image2.jpg');
    const userId1 = UserId.generate();
    const userId2 = UserId.generate();

    expect(coordinate1Result.isOk()).toBe(true);
    expect(coordinate2Result.isOk()).toBe(true);
    expect(imageUrl1Result.isOk()).toBe(true);
    expect(imageUrl2Result.isOk()).toBe(true);

    if (
      coordinate1Result.isOk() &&
      coordinate2Result.isOk() &&
      imageUrl1Result.isOk() &&
      imageUrl2Result.isOk()
    ) {
      const album1Result = Album.create(
        coordinate1Result.value,
        [imageUrl1Result.value],
        userId1
      );
      const album2Result = Album.create(
        coordinate2Result.value,
        [imageUrl2Result.value],
        userId2
      );

      expect(album1Result.isOk()).toBe(true);
      expect(album2Result.isOk()).toBe(true);

      if (album1Result.isOk() && album2Result.isOk()) {
        testAlbums = [album1Result.value, album2Result.value];
      }
    }
  });

  describe('execute', () => {
    it('全てのアルバムを取得する', async () => {
      vi.mocked(mockAlbumRepository.findAll).mockResolvedValue(ok(testAlbums));

      const result = await useCase.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.albums).toHaveLength(2);
        expect(result.value.albums).toEqual(testAlbums);
      }

      expect(mockAlbumRepository.findAll).toHaveBeenCalledOnce();
      expect(mockAlbumRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('特定ユーザーのアルバムを取得する', async () => {
      const userIdStr = testAlbums[0].userId.value;
      const userAlbums = [testAlbums[0]];

      vi.mocked(mockAlbumRepository.findByUserId).mockResolvedValue(
        ok(userAlbums)
      );

      const result = await useCase.execute({ userId: userIdStr });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.albums).toHaveLength(1);
        expect(result.value.albums[0].userId.value).toBe(userIdStr);
      }

      expect(mockAlbumRepository.findByUserId).toHaveBeenCalledWith(
        expect.objectContaining({ value: userIdStr })
      );
      expect(mockAlbumRepository.findAll).not.toHaveBeenCalled();
    });

    it('空のリクエストで全てのアルバムを取得する', async () => {
      vi.mocked(mockAlbumRepository.findAll).mockResolvedValue(ok([]));

      const result = await useCase.execute({});

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.albums).toHaveLength(0);
      }

      expect(mockAlbumRepository.findAll).toHaveBeenCalledOnce();
    });

    it('無効なユーザーIDでエラーになる', async () => {
      const result = await useCase.execute({ userId: 'invalid-user-id' });

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.findByUserId).not.toHaveBeenCalled();
      expect(mockAlbumRepository.findAll).not.toHaveBeenCalled();
    });

    it('全てのアルバム取得に失敗した場合エラーになる', async () => {
      vi.mocked(mockAlbumRepository.findAll).mockResolvedValue(
        err(new Error('Database error'))
      );

      const result = await useCase.execute();

      expect(result.isErr()).toBe(true);
    });

    it('ユーザーアルバム取得に失敗した場合エラーになる', async () => {
      const userIdStr = testAlbums[0].userId.value;

      vi.mocked(mockAlbumRepository.findByUserId).mockResolvedValue(
        err(new Error('Database error'))
      );

      const result = await useCase.execute({ userId: userIdStr });

      expect(result.isErr()).toBe(true);
    });
  });
});
