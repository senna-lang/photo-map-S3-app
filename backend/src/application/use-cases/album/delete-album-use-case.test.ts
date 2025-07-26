/**
 * DeleteAlbumUseCaseのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteAlbumUseCase } from './delete-album-use-case';
import { Album } from '../../../domain/entities';
import {
  AlbumId,
  Coordinate,
  ImageUrl,
  UserId,
} from '../../../domain/value-objects';
import { AlbumRepository } from '../../../domain/repositories';
import { EntityNotFoundError, UnauthorizedError } from '../../../domain/errors';
import { ok, err } from 'neverthrow';

describe('DeleteAlbumUseCase', () => {
  let useCase: DeleteAlbumUseCase;
  let mockAlbumRepository: AlbumRepository;
  let testAlbum: Album;
  let testUserId: UserId;
  let otherUserId: UserId;

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

    useCase = new DeleteAlbumUseCase(mockAlbumRepository);

    // テスト用データを作成
    testUserId = UserId.generate();
    otherUserId = UserId.generate();

    const coordinateResult = Coordinate.create(35.6762, 139.6503);
    const imageUrlResult = ImageUrl.create('https://example.com/image.jpg');

    expect(coordinateResult.isOk()).toBe(true);
    expect(imageUrlResult.isOk()).toBe(true);

    if (coordinateResult.isOk() && imageUrlResult.isOk()) {
      const albumResult = Album.create(
        coordinateResult.value,
        [imageUrlResult.value],
        testUserId
      );

      expect(albumResult.isOk()).toBe(true);
      if (albumResult.isOk()) {
        testAlbum = albumResult.value;
      }
    }
  });

  describe('execute', () => {
    const createValidRequest = () => ({
      albumId: testAlbum.id.value,
      userId: testUserId.value,
    });

    it('正常にアルバムを削除する', async () => {
      const request = createValidRequest();

      vi.mocked(mockAlbumRepository.findById).mockResolvedValue(ok(testAlbum));
      vi.mocked(mockAlbumRepository.delete).mockResolvedValue(ok(undefined));

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
      }

      expect(mockAlbumRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: testAlbum.id.value })
      );
      expect(mockAlbumRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ value: testAlbum.id.value })
      );
    });

    it('無効なアルバムIDでエラーになる', async () => {
      const request = {
        albumId: 'invalid-album-id',
        userId: testUserId.value,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.findById).not.toHaveBeenCalled();
    });

    it('無効なユーザーIDでエラーになる', async () => {
      const request = {
        albumId: testAlbum.id.value,
        userId: 'invalid-user-id',
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.findById).not.toHaveBeenCalled();
    });

    it('存在しないアルバムでEntityNotFoundErrorになる', async () => {
      const request = createValidRequest();

      vi.mocked(mockAlbumRepository.findById).mockResolvedValue(ok(null));

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityNotFoundError);
      }
      expect(mockAlbumRepository.delete).not.toHaveBeenCalled();
    });

    it('所有者でないユーザーがアクセスした場合UnauthorizedErrorになる', async () => {
      const request = {
        albumId: testAlbum.id.value,
        userId: otherUserId.value,
      };

      vi.mocked(mockAlbumRepository.findById).mockResolvedValue(ok(testAlbum));

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(UnauthorizedError);
      }
      expect(mockAlbumRepository.delete).not.toHaveBeenCalled();
    });

    it('アルバム検索に失敗した場合エラーになる', async () => {
      const request = createValidRequest();

      vi.mocked(mockAlbumRepository.findById).mockResolvedValue(
        err(new Error('Database error'))
      );

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.delete).not.toHaveBeenCalled();
    });

    it('アルバム削除に失敗した場合エラーになる', async () => {
      const request = createValidRequest();

      vi.mocked(mockAlbumRepository.findById).mockResolvedValue(ok(testAlbum));
      vi.mocked(mockAlbumRepository.delete).mockResolvedValue(
        err(new Error('Delete failed'))
      );

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
    });
  });
});
