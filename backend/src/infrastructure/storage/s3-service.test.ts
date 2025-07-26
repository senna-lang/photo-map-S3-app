/**
 * S3Serviceのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { S3Service, S3Config } from './s3-service';

// AWS SDKをモック
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}));

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

describe('S3Service', () => {
  let s3Service: S3Service;
  let config: S3Config;
  let mockS3Client: any;

  beforeEach(() => {
    config = {
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      region: 'us-east-1',
      bucketName: 'test-bucket',
    };

    mockS3Client = {
      send: vi.fn(),
    };

    (S3Client as any).mockImplementation(() => mockS3Client);

    s3Service = new S3Service(config);
    vi.resetAllMocks();
  });

  describe('generateUploadUrl', () => {
    it('正常にプリサインドURLを生成する', async () => {
      const mockSignedUrl =
        'https://test-bucket.s3.amazonaws.com/test-key?signed-params';

      (getSignedUrl as any).mockResolvedValue(mockSignedUrl);

      const result = await s3Service.generateUploadUrl(
        'test-image.jpg',
        'image/jpeg',
        'test-user-id'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.uploadUrl).toBe(mockSignedUrl);
        expect(result.value.fileKey).toMatch(
          /^uploads\/[a-f0-9]{8}\/\d+-[a-f0-9-]+-test-image\.jpg$/
        );
        expect(result.value.publicUrl).toContain(
          'https://test-bucket.s3.us-east-1.amazonaws.com/'
        );
      }

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: expect.stringMatching(
          /^uploads\/[a-f0-9]{8}\/\d+-[a-f0-9-]+-test-image\.jpg$/
        ),
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(Object),
        { expiresIn: 3600 }
      );
    });

    it('ファイル名をサニタイズする', async () => {
      const mockSignedUrl =
        'https://test-bucket.s3.amazonaws.com/test-key?signed-params';
      (getSignedUrl as any).mockResolvedValue(mockSignedUrl);

      const result = await s3Service.generateUploadUrl(
        'テスト画像 (1).jpg', // 日本語とスペース、括弧を含む
        'image/jpeg',
        'test-user-id'
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.fileKey).toMatch(/_______1_\.jpg$/); // サニタイズされている
      }
    });

    it('S3エラーが発生した場合エラーを返す', async () => {
      (getSignedUrl as any).mockRejectedValue(new Error('S3 error'));

      const result = await s3Service.generateUploadUrl(
        'test-image.jpg',
        'image/jpeg',
        'test-user-id'
      );

      expect(result.isErr()).toBe(true);
    });
  });

  describe('deleteFile', () => {
    it('正常にファイルを削除する', async () => {
      mockS3Client.send.mockResolvedValue({});

      const result = await s3Service.deleteFile('test-file-key');

      expect(result.isOk()).toBe(true);
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'test-file-key',
      });
      expect(mockS3Client.send).toHaveBeenCalledOnce();
    });

    it('S3エラーが発生した場合エラーを返す', async () => {
      mockS3Client.send.mockRejectedValue(new Error('Delete error'));

      const result = await s3Service.deleteFile('test-file-key');

      expect(result.isErr()).toBe(true);
    });
  });

  describe('getPublicUrl', () => {
    it('正しい公開URLを生成する', () => {
      const fileKey = 'uploads/test/image.jpg';
      const publicUrl = s3Service.getPublicUrl(fileKey);

      expect(publicUrl).toBe(
        'https://test-bucket.s3.us-east-1.amazonaws.com/uploads/test/image.jpg'
      );
    });
  });

  describe('extractFileKey', () => {
    it('公開URLからファイルキーを抽出する', () => {
      const publicUrl =
        'https://test-bucket.s3.us-east-1.amazonaws.com/uploads/test/image.jpg';
      const fileKey = s3Service.extractFileKey(publicUrl);

      expect(fileKey).toBe('uploads/test/image.jpg');
    });

    it('無効なURLの場合nullを返す', () => {
      const invalidUrl = 'https://other-bucket.s3.amazonaws.com/test.jpg';
      const fileKey = s3Service.extractFileKey(invalidUrl);

      expect(fileKey).toBeNull();
    });
  });

  describe('isSupportedImageType', () => {
    it('サポートされている画像形式でtrueを返す', () => {
      expect(S3Service.isSupportedImageType('image/jpeg')).toBe(true);
      expect(S3Service.isSupportedImageType('image/jpg')).toBe(true);
      expect(S3Service.isSupportedImageType('image/png')).toBe(true);
      expect(S3Service.isSupportedImageType('image/webp')).toBe(true);
      expect(S3Service.isSupportedImageType('image/gif')).toBe(true);
    });

    it('サポートされていない形式でfalseを返す', () => {
      expect(S3Service.isSupportedImageType('text/plain')).toBe(false);
      expect(S3Service.isSupportedImageType('application/pdf')).toBe(false);
      expect(S3Service.isSupportedImageType('video/mp4')).toBe(false);
    });

    it('大文字小文字を区別せずチェックする', () => {
      expect(S3Service.isSupportedImageType('IMAGE/JPEG')).toBe(true);
      expect(S3Service.isSupportedImageType('Image/PNG')).toBe(true);
    });
  });

  describe('isValidFileSize', () => {
    it('制限内のファイルサイズでtrueを返す', () => {
      expect(S3Service.isValidFileSize(1024)).toBe(true); // 1KB
      expect(S3Service.isValidFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
      expect(S3Service.isValidFileSize(10 * 1024 * 1024)).toBe(true); // 10MB（上限）
    });

    it('制限を超えるファイルサイズでfalseを返す', () => {
      expect(S3Service.isValidFileSize(10 * 1024 * 1024 + 1)).toBe(false); // 10MB + 1byte
      expect(S3Service.isValidFileSize(50 * 1024 * 1024)).toBe(false); // 50MB
    });
  });
});
