/**
 * AWS S3サービス
 * 写真のアップロードとURL生成を行う
 */

import { Result, ok, err } from 'neverthrow';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash, randomUUID } from 'crypto';

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

export class S3Service {
  private readonly s3Client: S3Client;

  constructor(private readonly config: S3Config) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * プリサインドURLを生成する
   */
  async generateUploadUrl(
    filename: string,
    contentType: string,
    userId: string
  ): Promise<Result<UploadUrlResponse, Error>> {
    try {
      // ファイル名をサニタイズ
      const sanitizedFilename = this.sanitizeFilename(filename);

      // ユニークなファイルキーを生成
      const fileKey = this.generateFileKey(userId, sanitizedFilename);

      // プリサインドURLを生成
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
        ContentType: contentType,
        // アップロード後に公開読み取り可能にする
        ACL: 'public-read',
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600, // 1時間
      });

      // 公開URLを生成
      const publicUrl = `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${fileKey}`;

      return ok({
        uploadUrl,
        fileKey,
        publicUrl,
      });
    } catch (error) {
      return err(new Error(`Failed to generate upload URL: ${error}`));
    }
  }

  /**
   * ファイルを削除する
   */
  async deleteFile(fileKey: string): Promise<Result<void, Error>> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Failed to delete file: ${error}`));
    }
  }

  /**
   * ファイル名をサニタイズする
   */
  private sanitizeFilename(filename: string): string {
    // 拡張子を保持しつつ、安全なファイル名にする
    const extension = filename.substring(filename.lastIndexOf('.'));
    const baseName = filename.substring(0, filename.lastIndexOf('.'));

    // 英数字、ハイフン、アンダースコアのみ許可
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');

    return `${sanitizedBaseName}${extension}`;
  }

  /**
   * ユニークなファイルキーを生成する
   */
  private generateFileKey(userId: string, filename: string): string {
    // ユーザーIDをハッシュ化（プライバシー保護）
    const userHash = createHash('sha256')
      .update(userId)
      .digest('hex')
      .substring(0, 8);

    // タイムスタンプとUUIDで一意性を保証
    const timestamp = Date.now();
    const uuid = randomUUID();

    return `uploads/${userHash}/${timestamp}-${uuid}-${filename}`;
  }

  /**
   * ファイルキーから公開URLを生成する
   */
  getPublicUrl(fileKey: string): string {
    return `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${fileKey}`;
  }

  /**
   * 公開URLからファイルキーを抽出する
   */
  extractFileKey(publicUrl: string): string | null {
    const baseUrl = `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/`;

    if (publicUrl.startsWith(baseUrl)) {
      return publicUrl.substring(baseUrl.length);
    }

    return null;
  }

  /**
   * サポートされている画像形式かチェック
   */
  static isSupportedImageType(contentType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    return supportedTypes.includes(contentType.toLowerCase());
  }

  /**
   * ファイルサイズが制限内かチェック
   */
  static isValidFileSize(sizeInBytes: number): boolean {
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    return sizeInBytes <= maxSizeInBytes;
  }
}
