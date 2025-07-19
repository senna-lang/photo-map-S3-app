import { Result, ok, err } from 'neverthrow';
import { eq } from 'drizzle-orm';
import { Database } from '../database/connection.js';
import { albums } from '../database/schema.js';
import { AlbumRepository, AlbumRepositoryError } from '../../domain/repositories/album-repository.js';
import { Album } from '../../domain/entities/album.js';
import { AlbumId, UserId } from '../../domain/value-objects/ids.js';
import { Coordinate } from '../../domain/value-objects/coordinate.js';
import { ImageUrl } from '../../domain/value-objects/image-url.js';

export class DrizzleAlbumRepositoryError extends Error implements AlbumRepositoryError {
  name = 'AlbumRepositoryError' as const;
  
  constructor(message: string, public cause?: Error) {
    super(message);
  }
}

export class DrizzleAlbumRepository implements AlbumRepository {
  constructor(private db: Database) {}

  async save(album: Album): Promise<Result<void, AlbumRepositoryError>> {
    try {
      await this.db
        .insert(albums)
        .values({
          id: album.id.value,
          userId: album.userId.value,
          coordinate: album.coordinate.toObject(),
          imageUrls: album.imageUrls.map(url => url.value),
          createdAt: album.createdAt,
          updatedAt: album.updatedAt,
        })
        .onConflictDoUpdate({
          target: albums.id,
          set: {
            coordinate: album.coordinate.toObject(),
            imageUrls: album.imageUrls.map(url => url.value),
            updatedAt: album.updatedAt,
          },
        });

      return ok(undefined);
    } catch (error) {
      return err(new DrizzleAlbumRepositoryError(
        'Failed to save album',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  async findById(id: AlbumId): Promise<Result<Album | null, AlbumRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(albums)
        .where(eq(albums.id, id.value))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const albumData = result[0];
      const domainAlbum = this.toDomain(albumData);
      
      return domainAlbum.match(
        album => ok(album),
        error => err(new DrizzleAlbumRepositoryError(`Failed to convert album data: ${error.message}`))
      );
    } catch (error) {
      return err(new DrizzleAlbumRepositoryError(
        'Failed to find album by id',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  async findByUserId(userId: UserId): Promise<Result<Album[], AlbumRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(albums)
        .where(eq(albums.userId, userId.value))
        .orderBy(albums.createdAt);

      const domainAlbums: Album[] = [];
      
      for (const albumData of result) {
        const domainAlbum = this.toDomain(albumData);
        if (domainAlbum.isErr()) {
          return err(new DrizzleAlbumRepositoryError(`Failed to convert album data: ${domainAlbum.error.message}`));
        }
        domainAlbums.push(domainAlbum.value);
      }

      return ok(domainAlbums);
    } catch (error) {
      return err(new DrizzleAlbumRepositoryError(
        'Failed to find albums by user id',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  async findAll(): Promise<Result<Album[], AlbumRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(albums)
        .orderBy(albums.createdAt);

      const domainAlbums: Album[] = [];
      
      for (const albumData of result) {
        const domainAlbum = this.toDomain(albumData);
        if (domainAlbum.isErr()) {
          return err(new DrizzleAlbumRepositoryError(`Failed to convert album data: ${domainAlbum.error.message}`));
        }
        domainAlbums.push(domainAlbum.value);
      }

      return ok(domainAlbums);
    } catch (error) {
      return err(new DrizzleAlbumRepositoryError(
        'Failed to find all albums',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  async delete(id: AlbumId): Promise<Result<void, AlbumRepositoryError>> {
    try {
      await this.db
        .delete(albums)
        .where(eq(albums.id, id.value));

      return ok(undefined);
    } catch (error) {
      return err(new DrizzleAlbumRepositoryError(
        'Failed to delete album',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  private toDomain(data: any): Result<Album, Error> {
    const albumIdResult = AlbumId.create(data.id);
    if (albumIdResult.isErr()) {
      return err(albumIdResult.error);
    }

    const userIdResult = UserId.create(data.userId);
    if (userIdResult.isErr()) {
      return err(userIdResult.error);
    }

    const coordinateResult = Coordinate.create(
      data.coordinate.lng,
      data.coordinate.lat
    );
    if (coordinateResult.isErr()) {
      return err(coordinateResult.error);
    }

    const imageUrlResults = data.imageUrls.map((url: string) => ImageUrl.create(url));
    const failedImageUrl = imageUrlResults.find(result => result.isErr());
    if (failedImageUrl) {
      return err(failedImageUrl.error);
    }

    const imageUrls = imageUrlResults.map(result => result.value);

    return Album.create(
      coordinateResult.value,
      imageUrls,
      userIdResult.value,
      albumIdResult.value,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    ).mapErr(error => new Error(error.message));
  }
}