/**
 * Albumエンティティのテスト
 */

import { describe, it, expect } from 'vitest';
import { Album } from './album';
import { Coordinate, ImageUrl, UserId } from '../value-objects';
import { EntityValidationError, UnauthorizedError } from '../errors';

// テスト用のヘルパー関数
function createValidCoordinate() {
  const result = Coordinate.create(35.6762, 139.6503);
  if (result.isErr()) throw result.error;
  return result.value; // 東京駅
}

function createValidImageUrls(count: number = 1) {
  return Array.from({ length: count }, (_, i) => {
    const result = ImageUrl.create(`https://example.com/image${i + 1}.jpg`);
    if (result.isErr()) throw result.error;
    return result.value;
  });
}

function createValidUserId() {
  return UserId.generate();
}

describe('Album', () => {
  describe('create', () => {
    it('正常なデータでアルバムが作成される', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(3);
      const userId = createValidUserId();

      const result = Album.create(coordinate, imageUrls, userId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const album = result.value;
        expect(album.coordinate.equals(coordinate)).toBe(true);
        expect(album.imageUrls).toHaveLength(3);
        expect(album.userId.equals(userId)).toBe(true);
        expect(album.imageCount).toBe(3);
      }
    });

    it('画像が0個の場合エラーになる', () => {
      const coordinate = createValidCoordinate();
      const imageUrls: ImageUrl[] = [];
      const userId = createValidUserId();

      const result = Album.create(coordinate, imageUrls, userId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityValidationError);
        expect(result.error.message).toContain(
          'At least one image is required'
        );
      }
    });

    it('画像が10個を超える場合エラーになる', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(11);
      const userId = createValidUserId();

      const result = Album.create(coordinate, imageUrls, userId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityValidationError);
        expect(result.error.message).toContain(
          'Maximum 10 images allowed per album'
        );
      }
    });

    it('重複するURLがある場合エラーになる', () => {
      const coordinate = createValidCoordinate();
      const imageUrlResult = ImageUrl.create('https://example.com/image.jpg');
      if (imageUrlResult.isErr()) throw imageUrlResult.error;
      const imageUrl = imageUrlResult.value;
      const imageUrls = [imageUrl, imageUrl]; // 重複
      const userId = createValidUserId();

      const result = Album.create(coordinate, imageUrls, userId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityValidationError);
        expect(result.error.message).toContain(
          'Duplicate image URLs are not allowed'
        );
      }
    });

    it('作成時にIDが自動生成される', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(1);
      const userId = createValidUserId();

      const result = Album.create(coordinate, imageUrls, userId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id.value).toBeDefined();
        expect(result.value.id.value).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
      }
    });
  });

  describe('addImage', () => {
    it('所有者が画像を追加できる', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(2);
      const userId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      const newImageUrlResult = ImageUrl.create(
        'https://example.com/new-image.jpg'
      );
      if (newImageUrlResult.isErr()) throw newImageUrlResult.error;
      const newImageUrl = newImageUrlResult.value;
      const addResult = album.addImage(newImageUrl, userId);

      expect(addResult.isOk()).toBe(true);
      expect(album.imageCount).toBe(3);
      expect(album.imageUrls).toContain(newImageUrl);
    });

    it('所有者以外は画像を追加できない', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(2);
      const userId = createValidUserId();
      const otherUserId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      const newImageUrlResult = ImageUrl.create(
        'https://example.com/new-image.jpg'
      );
      if (newImageUrlResult.isErr()) throw newImageUrlResult.error;
      const newImageUrl = newImageUrlResult.value;
      const addResult = album.addImage(newImageUrl, otherUserId);

      expect(addResult.isErr()).toBe(true);
      if (addResult.isErr()) {
        expect(addResult.error).toBeInstanceOf(UnauthorizedError);
        expect(addResult.error.message).toContain(
          'Only the album owner can add images'
        );
      }
    });

    it('10個目の画像を追加しようとするとエラーになる', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(10);
      const userId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      const newImageUrlResult = ImageUrl.create(
        'https://example.com/new-image.jpg'
      );
      if (newImageUrlResult.isErr()) throw newImageUrlResult.error;
      const newImageUrl = newImageUrlResult.value;
      const addResult = album.addImage(newImageUrl, userId);

      expect(addResult.isErr()).toBe(true);
      if (addResult.isErr()) {
        expect(addResult.error).toBeInstanceOf(EntityValidationError);
        expect(addResult.error.message).toContain(
          'Maximum 10 images allowed per album'
        );
      }
    });

    it('重複するURLを追加しようとするとエラーになる', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(2);
      const userId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      const existingImageUrl = album.imageUrls[0];
      const addResult = album.addImage(existingImageUrl, userId);

      expect(addResult.isErr()).toBe(true);
      if (addResult.isErr()) {
        expect(addResult.error).toBeInstanceOf(EntityValidationError);
        expect(addResult.error.message).toContain(
          'Image URL already exists in album'
        );
      }
    });
  });

  describe('removeImage', () => {
    it('所有者が画像を削除できる', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(3);
      const userId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      const imageToRemove = album.imageUrls[0];
      const removeResult = album.removeImage(imageToRemove, userId);

      expect(removeResult.isOk()).toBe(true);
      expect(album.imageCount).toBe(2);
      expect(album.imageUrls).not.toContain(imageToRemove);
    });

    it('所有者以外は画像を削除できない', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(3);
      const userId = createValidUserId();
      const otherUserId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      const imageToRemove = album.imageUrls[0];
      const removeResult = album.removeImage(imageToRemove, otherUserId);

      expect(removeResult.isErr()).toBe(true);
      if (removeResult.isErr()) {
        expect(removeResult.error).toBeInstanceOf(UnauthorizedError);
        expect(removeResult.error.message).toContain(
          'Only the album owner can remove images'
        );
      }
    });

    it('最後の画像は削除できない', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(1);
      const userId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      const imageToRemove = album.imageUrls[0];
      const removeResult = album.removeImage(imageToRemove, userId);

      expect(removeResult.isErr()).toBe(true);
      if (removeResult.isErr()) {
        expect(removeResult.error).toBeInstanceOf(EntityValidationError);
        expect(removeResult.error.message).toContain(
          'Cannot remove the last image from album'
        );
      }
    });

    it('存在しない画像を削除しようとするとエラーになる', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(3);
      const userId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      const nonExistentImageUrlResult = ImageUrl.create(
        'https://example.com/non-existent.jpg'
      );
      if (nonExistentImageUrlResult.isErr())
        throw nonExistentImageUrlResult.error;
      const nonExistentImageUrl = nonExistentImageUrlResult.value;
      const removeResult = album.removeImage(nonExistentImageUrl, userId);

      expect(removeResult.isErr()).toBe(true);
      if (removeResult.isErr()) {
        expect(removeResult.error).toBeInstanceOf(EntityValidationError);
        expect(removeResult.error.message).toContain(
          'Image URL not found in album'
        );
      }
    });
  });

  describe('isOwnedBy', () => {
    it('正しい所有者の場合trueを返す', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(1);
      const userId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      expect(album.isOwnedBy(userId)).toBe(true);
    });

    it('異なるユーザーの場合falseを返す', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(1);
      const userId = createValidUserId();
      const otherUserId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      expect(album.isOwnedBy(otherUserId)).toBe(false);
    });
  });

  describe('distanceFrom', () => {
    it('指定した座標からの距離を正しく計算する', () => {
      const tokyoStationResult = Coordinate.create(35.6762, 139.6503);
      if (tokyoStationResult.isErr()) throw tokyoStationResult.error;
      const tokyoStation = tokyoStationResult.value;
      const imageUrls = createValidImageUrls(1);
      const userId = createValidUserId();
      const albumResult = Album.create(tokyoStation, imageUrls, userId);
      if (albumResult.isErr()) throw albumResult.error;
      const album = albumResult.value;

      const shinjukuStationResult = Coordinate.create(35.6896, 139.7006);
      if (shinjukuStationResult.isErr()) throw shinjukuStationResult.error;
      const shinjukuStation = shinjukuStationResult.value;
      const distance = album.distanceFrom(shinjukuStation);

      expect(distance).toBeGreaterThan(4);
      expect(distance).toBeLessThan(6);
    });
  });

  describe('equals', () => {
    it('同じIDのアルバムの場合trueを返す', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(1);
      const userId = createValidUserId();
      const album1Result = Album.create(coordinate, imageUrls, userId);
      if (album1Result.isErr()) throw album1Result.error;
      const album1 = album1Result.value;

      // reconstruct で同じIDのアルバムを作成
      const album2 = Album.reconstruct(
        album1.id,
        coordinate,
        imageUrls,
        userId,
        album1.createdAt,
        album1.updatedAt
      );

      expect(album1.equals(album2)).toBe(true);
    });

    it('異なるIDのアルバムの場合falseを返す', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(1);
      const userId = createValidUserId();
      const album1Result = Album.create(coordinate, imageUrls, userId);
      if (album1Result.isErr()) throw album1Result.error;
      const album1 = album1Result.value;
      const album2Result = Album.create(coordinate, imageUrls, userId);
      if (album2Result.isErr()) throw album2Result.error;
      const album2 = album2Result.value;

      expect(album1.equals(album2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('正しいJSON形式を返す', () => {
      const coordinate = createValidCoordinate();
      const imageUrls = createValidImageUrls(2);
      const userId = createValidUserId();
      const result = Album.create(coordinate, imageUrls, userId);
      if (result.isErr()) throw result.error;
      const album = result.value;

      const json = album.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('coordinate');
      expect(json).toHaveProperty('imageUrls');
      expect(json).toHaveProperty('userId');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
      expect(json.imageUrls).toHaveLength(2);
      expect(json.coordinate).toEqual({
        latitude: 35.6762,
        longitude: 139.6503,
      });
    });
  });
});
