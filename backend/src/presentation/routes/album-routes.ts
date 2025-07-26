/**
 * アルバム関連のAPIルート
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  CreateAlbumUseCase,
  GetAlbumsUseCase,
  DeleteAlbumUseCase,
} from '../../application/use-cases/album';
import { AlbumRepository } from '../../domain/repositories';
import { JwtService } from '../../infrastructure/auth';
import { S3Service } from '../../infrastructure/storage';
import { requireAuth, optionalAuth } from '../middleware';

// バリデーションスキーマ
const createAlbumSchema = z.object({
  coordinate: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  imageUrls: z.array(z.string().url()).min(1).max(10),
});

const uploadRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.number().positive(),
});

export function createAlbumRoutes(
  albumRepository: AlbumRepository,
  jwtService: JwtService,
  s3Service: S3Service
) {
  const app = new Hono();

  // アルバム一覧取得（認証オプショナル）
  app.get('/', optionalAuth(jwtService), async (c) => {
    const authContext = c.get('user');
    const userIdParam = c.req.query('userId');

    const getAlbumsUseCase = new GetAlbumsUseCase(albumRepository);

    // 認証されている場合、そのユーザーのアルバムのみ取得可能
    // 認証されていない場合は全てのアルバムを取得
    const userId = authContext?.userId.value || userIdParam;

    const result = await getAlbumsUseCase.execute({ userId });

    if (result.isErr()) {
      console.error('Get albums failed:', result.error);
      return c.json(
        {
          error: 'Failed to get albums',
          message: result.error.message,
        },
        500
      );
    }

    return c.json({
      albums: result.value.albums.map((album) => album.toJSON()),
    });
  });

  // アルバム作成
  app.post(
    '/',
    requireAuth(jwtService),
    zValidator('json', createAlbumSchema),
    async (c) => {
      const authContext = c.get('user');
      if (!authContext) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const { coordinate, imageUrls } = c.req.valid('json');

      const createAlbumUseCase = new CreateAlbumUseCase(albumRepository);

      const result = await createAlbumUseCase.execute({
        coordinate,
        imageUrls,
        userId: authContext.userId.value,
      });

      if (result.isErr()) {
        console.error('Create album failed:', result.error);
        return c.json(
          {
            error: 'Failed to create album',
            message: result.error.message,
          },
          400
        );
      }

      return c.json(
        {
          album: result.value.album.toJSON(),
        },
        201
      );
    }
  );

  // アルバム削除
  app.delete('/:albumId', requireAuth(jwtService), async (c) => {
    const authContext = c.get('user');
    if (!authContext) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const albumId = c.req.param('albumId');

    const deleteAlbumUseCase = new DeleteAlbumUseCase(albumRepository);

    const result = await deleteAlbumUseCase.execute({
      albumId,
      userId: authContext.userId.value,
    });

    if (result.isErr()) {
      console.error('Delete album failed:', result.error);

      // エラーの種類に応じてステータスコードを変更
      if (result.error.message.includes('not found')) {
        return c.json(
          {
            error: 'Album not found',
            message: result.error.message,
          },
          404
        );
      }

      if (
        result.error.message.includes('Unauthorized') ||
        result.error.message.includes('owner')
      ) {
        return c.json(
          {
            error: 'Forbidden',
            message: result.error.message,
          },
          403
        );
      }

      return c.json(
        {
          error: 'Failed to delete album',
          message: result.error.message,
        },
        500
      );
    }

    return c.json({
      message: 'Album deleted successfully',
    });
  });

  // プリサインドアップロードURL生成
  app.post(
    '/upload-url',
    requireAuth(jwtService),
    zValidator('json', uploadRequestSchema),
    async (c) => {
      const authContext = c.get('user');
      if (!authContext) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const { filename, contentType, fileSize } = c.req.valid('json');

      // ファイル形式チェック
      if (!S3Service.isSupportedImageType(contentType)) {
        return c.json(
          {
            error: 'Unsupported file type',
            message: 'Only image files are allowed (JPEG, PNG, WebP, GIF)',
          },
          400
        );
      }

      // ファイルサイズチェック
      if (!S3Service.isValidFileSize(fileSize)) {
        return c.json(
          {
            error: 'File too large',
            message: 'File size must be less than 10MB',
          },
          400
        );
      }

      const result = await s3Service.generateUploadUrl(
        filename,
        contentType,
        authContext.userId.value
      );

      if (result.isErr()) {
        console.error('Generate upload URL failed:', result.error);
        return c.json(
          {
            error: 'Failed to generate upload URL',
            message: result.error.message,
          },
          500
        );
      }

      return c.json({
        uploadUrl: result.value.uploadUrl,
        fileKey: result.value.fileKey,
        publicUrl: result.value.publicUrl,
      });
    }
  );

  return app;
}
