/**
 * Drizzle ORMを使用したAlbumRepositoryの実装
 * ドメインエンティティとデータベースレコード間の変換を担当
 */

import { Result, ok, err } from 'neverthrow';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { AlbumRepository } from '../../domain/repositories/album-repository';
import { Album } from '../../domain/entities/album';
import {
  AlbumId,
  Coordinate,
  ImageUrl,
  UserId,
} from '../../domain/value-objects';
import { EntityNotFoundError } from '../../domain/errors';
import { albums, type Album as DbAlbum } from '../database/schema';

export class DrizzleAlbumRepository implements AlbumRepository {
  constructor(private db: PostgresJsDatabase<any>) {}

  /**
   * アルバムを保存する
   */
  async save(album: Album): Promise<Result<void, Error>> {
    try {
      const dbAlbum = this.toDbRecord(album);

      // upsert操作（存在する場合は更新、しない場合は挿入）
      await this.db
        .insert(albums)
        .values(dbAlbum)
        .onConflictDoUpdate({
          target: albums.id,
          set: {
            coordinate: dbAlbum.coordinate,
            imageUrls: dbAlbum.imageUrls,
            updatedAt: new Date(),
          },
        });

      return ok(undefined);
    } catch (error) {
      return err(
        new Error(
          `Failed to save album: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * IDでアルバムを検索する
   */
  async findById(id: AlbumId): Promise<Result<Album | null, Error>> {
    try {
      const result = await this.db
        .select()
        .from(albums)
        .where(eq(albums.id, id.value))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const albumResult = this.toDomainEntity(result[0]);
      if (albumResult.isErr()) {
        return err(albumResult.error);
      }

      return ok(albumResult.value);
    } catch (error) {
      return err(
        new Error(
          `Failed to find album by id: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * ユーザーIDでアルバムを検索する
   */
  async findByUserId(userId: UserId): Promise<Result<Album[], Error>> {
    try {
      const result = await this.db
        .select()
        .from(albums)
        .where(eq(albums.userId, userId.value))
        .orderBy(albums.createdAt);

      const albumResults = result.map((record) => this.toDomainEntity(record));

      // すべての変換が成功したかチェック
      const domainAlbums: Album[] = [];
      for (const albumResult of albumResults) {
        if (albumResult.isErr()) {
          return err(albumResult.error);
        }
        domainAlbums.push(albumResult.value);
      }

      return ok(domainAlbums);
    } catch (error) {
      return err(
        new Error(
          `Failed to find albums by user id: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * 全てのアルバムを取得する
   */
  async findAll(): Promise<Result<Album[], Error>> {
    try {
      const result = await this.db
        .select()
        .from(albums)
        .orderBy(albums.createdAt);

      const albumResults = result.map((record) => this.toDomainEntity(record));

      // すべての変換が成功したかチェック
      const domainAlbums: Album[] = [];
      for (const albumResult of albumResults) {
        if (albumResult.isErr()) {
          return err(albumResult.error);
        }
        domainAlbums.push(albumResult.value);
      }

      return ok(domainAlbums);
    } catch (error) {
      return err(
        new Error(
          `Failed to find all albums: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * アルバムを削除する
   */
  async delete(
    id: AlbumId
  ): Promise<Result<void, EntityNotFoundError | Error>> {
    try {
      const result = await this.db
        .delete(albums)
        .where(eq(albums.id, id.value))
        .returning({ id: albums.id });

      if (result.length === 0) {
        return err(new EntityNotFoundError('Album', id.value));
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new Error(
          `Failed to delete album: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * アルバムが存在するかチェックする
   */
  async exists(id: AlbumId): Promise<Result<boolean, Error>> {
    try {
      const result = await this.db
        .select({ id: albums.id })
        .from(albums)
        .where(eq(albums.id, id.value))
        .limit(1);

      return ok(result.length > 0);
    } catch (error) {
      return err(
        new Error(
          `Failed to check album existence: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * ユーザーのアルバム数を取得する
   */
  async countByUserId(userId: UserId): Promise<Result<number, Error>> {
    try {
      const result = await this.db
        .select({ count: albums.id })
        .from(albums)
        .where(eq(albums.userId, userId.value));

      return ok(result.length);
    } catch (error) {
      return err(
        new Error(
          `Failed to count albums by user id: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * ドメインエンティティをデータベースレコードに変換
   */
  private toDbRecord(album: Album): typeof albums.$inferInsert {
    return {
      id: album.id.value,
      userId: album.userId.value,
      coordinate: {
        latitude: album.coordinate.latitude,
        longitude: album.coordinate.longitude,
      },
      imageUrls: album.imageUrls.map((url) => url.value),
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
    };
  }

  /**
   * データベースレコードをドメインエンティティに変換
   */
  private toDomainEntity(record: DbAlbum): Result<Album, Error> {
    try {
      // AlbumIdの生成
      const albumIdResult = AlbumId.create(record.id);
      if (albumIdResult.isErr()) {
        return err(
          new Error(`Invalid album ID: ${albumIdResult.error.message}`)
        );
      }

      // UserIdの生成
      const userIdResult = UserId.create(record.userId);
      if (userIdResult.isErr()) {
        return err(new Error(`Invalid user ID: ${userIdResult.error.message}`));
      }

      // Coordinateの生成
      const coordinate = record.coordinate as {
        latitude: number;
        longitude: number;
      };
      const coordinateResult = Coordinate.create(
        coordinate.latitude,
        coordinate.longitude
      );
      if (coordinateResult.isErr()) {
        return err(
          new Error(`Invalid coordinate: ${coordinateResult.error.message}`)
        );
      }

      // ImageUrlsの生成
      const imageUrls = record.imageUrls as string[];
      const imageUrlResults = imageUrls.map((url) => ImageUrl.create(url));

      // すべてのImageUrlが有効かチェック
      const validImageUrls: ImageUrl[] = [];
      for (const imageUrlResult of imageUrlResults) {
        if (imageUrlResult.isErr()) {
          return err(
            new Error(`Invalid image URL: ${imageUrlResult.error.message}`)
          );
        }
        validImageUrls.push(imageUrlResult.value);
      }

      // Albumエンティティの再構築
      const album = Album.reconstruct(
        albumIdResult.value,
        coordinateResult.value,
        validImageUrls,
        userIdResult.value,
        record.createdAt,
        record.updatedAt
      );

      return ok(album);
    } catch (error) {
      return err(
        new Error(
          `Failed to convert database record to domain entity: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }
}
