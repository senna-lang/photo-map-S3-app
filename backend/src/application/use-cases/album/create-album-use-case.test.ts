/**
 * CreateAlbumUseCaseのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateAlbumUseCase } from './create-album-use-case';
import { AlbumRepository } from '../../../domain/repositories';
import { ok, err } from 'neverthrow';

describe('CreateAlbumUseCase', () => {
  let useCase: CreateAlbumUseCase;
  let mockAlbumRepository: AlbumRepository;

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

    useCase = new CreateAlbumUseCase(mockAlbumRepository);
  });

  describe('execute', () => {
    const validRequest = {
      coordinate: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      imageUrls: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ],
      userId: '550e8400-e29b-41d4-a716-446655440000',
    };

    it('正常にアルバムを作成する', async () => {
      vi.mocked(mockAlbumRepository.save).mockResolvedValue(ok(undefined));

      const result = await useCase.execute(validRequest);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.album.coordinate.latitude).toBe(
          validRequest.coordinate.latitude
        );
        expect(result.value.album.coordinate.longitude).toBe(
          validRequest.coordinate.longitude
        );
        expect(result.value.album.imageUrls).toHaveLength(2);
        expect(result.value.album.userId.value).toBe(validRequest.userId);
      }

      expect(mockAlbumRepository.save).toHaveBeenCalledOnce();
    });

    it('無効な座標でエラーになる', async () => {
      const invalidRequest = {
        ...validRequest,
        coordinate: {
          latitude: 91, // 無効な緯度
          longitude: 139.6503,
        },
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.save).not.toHaveBeenCalled();
    });

    it('無効なユーザーIDでエラーになる', async () => {
      const invalidRequest = {
        ...validRequest,
        userId: 'invalid-user-id',
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.save).not.toHaveBeenCalled();
    });

    it('無効な画像URLでエラーになる', async () => {
      const invalidRequest = {
        ...validRequest,
        imageUrls: [
          'https://example.com/image1.jpg',
          'invalid-url', // 無効なURL
        ],
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.save).not.toHaveBeenCalled();
    });

    it('空の画像URL配列でエラーになる', async () => {
      const invalidRequest = {
        ...validRequest,
        imageUrls: [], // 空の配列
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.save).not.toHaveBeenCalled();
    });

    it('画像URL数が上限を超えた場合エラーになる', async () => {
      const invalidRequest = {
        ...validRequest,
        imageUrls: Array(11).fill('https://example.com/image.jpg'), // 11枚（上限10枚）
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.save).not.toHaveBeenCalled();
    });

    it('重複する画像URLでエラーになる', async () => {
      const invalidRequest = {
        ...validRequest,
        imageUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image1.jpg', // 重複
        ],
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.save).not.toHaveBeenCalled();
    });

    it('リポジトリ保存に失敗した場合エラーになる', async () => {
      vi.mocked(mockAlbumRepository.save).mockResolvedValue(
        err(new Error('Database error'))
      );

      const result = await useCase.execute(validRequest);

      expect(result.isErr()).toBe(true);
      expect(mockAlbumRepository.save).toHaveBeenCalledOnce();
    });
  });
});
