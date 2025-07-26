/**
 * ImageUrlクラスのテスト
 */

import { describe, it, expect } from 'vitest';
import { ImageUrl } from './image-url';
import { InvalidUrlFormatError } from '../errors';

describe('ImageUrl', () => {
  describe('create', () => {
    it('正常なHTTPS画像URLで作成される', () => {
      const url = 'https://example.com/image.jpg';
      const result = ImageUrl.create(url);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(url);
      }
    });

    it('正常なHTTP画像URLで作成される', () => {
      const url = 'http://example.com/image.png';
      const result = ImageUrl.create(url);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(url);
      }
    });

    it('各種画像形式に対応する', () => {
      const urls = [
        'https://example.com/image.jpg',
        'https://example.com/image.jpeg',
        'https://example.com/image.png',
        'https://example.com/image.gif',
        'https://example.com/image.webp',
      ];

      urls.forEach((url) => {
        const result = ImageUrl.create(url);
        expect(result.isOk()).toBe(true);
      });
    });

    it('無効なURL形式の場合エラーになる', () => {
      const invalidUrls = [
        'invalid-url',
        'ftp://example.com/image.jpg',
        'not-a-url-at-all',
        '',
      ];

      invalidUrls.forEach((url) => {
        const result = ImageUrl.create(url);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error).toBeInstanceOf(InvalidUrlFormatError);
        }
      });
    });

    it('非画像ファイルの場合エラーになる', () => {
      const nonImageUrls = [
        'https://example.com/document.pdf',
        'https://example.com/video.mp4',
        'https://example.com/audio.mp3',
        'https://example.com/page.html',
      ];

      nonImageUrls.forEach((url) => {
        const result = ImageUrl.create(url);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error).toBeInstanceOf(InvalidUrlFormatError);
          expect(result.error.message).toContain('must be a valid image file');
        }
      });
    });

    it('不正なプロトコルの場合エラーになる', () => {
      const result = ImageUrl.create('ftp://example.com/image.jpg');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidUrlFormatError);
      }
    });
  });

  describe('equals', () => {
    it('同じURLの場合trueを返す', () => {
      const url = 'https://example.com/image.jpg';
      const imageUrl1Result = ImageUrl.create(url);
      if (imageUrl1Result.isErr()) throw imageUrl1Result.error;
      const imageUrl1 = imageUrl1Result.value;
      const imageUrl2Result = ImageUrl.create(url);
      if (imageUrl2Result.isErr()) throw imageUrl2Result.error;
      const imageUrl2 = imageUrl2Result.value;

      expect(imageUrl1.equals(imageUrl2)).toBe(true);
    });

    it('異なるURLの場合falseを返す', () => {
      const imageUrl1Result = ImageUrl.create('https://example.com/image1.jpg');
      if (imageUrl1Result.isErr()) throw imageUrl1Result.error;
      const imageUrl1 = imageUrl1Result.value;
      const imageUrl2Result = ImageUrl.create('https://example.com/image2.jpg');
      if (imageUrl2Result.isErr()) throw imageUrl2Result.error;
      const imageUrl2 = imageUrl2Result.value;

      expect(imageUrl1.equals(imageUrl2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('URLの文字列表現を返す', () => {
      const url = 'https://example.com/image.jpg';
      const imageUrlResult = ImageUrl.create(url);
      if (imageUrlResult.isErr()) throw imageUrlResult.error;
      const imageUrl = imageUrlResult.value;

      expect(imageUrl.toString()).toBe(url);
    });
  });

  describe('toJSON', () => {
    it('URL文字列を返す', () => {
      const url = 'https://example.com/image.jpg';
      const imageUrlResult = ImageUrl.create(url);
      if (imageUrlResult.isErr()) throw imageUrlResult.error;
      const imageUrl = imageUrlResult.value;

      expect(imageUrl.toJSON()).toBe(url);
    });
  });
});
