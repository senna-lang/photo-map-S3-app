import { Result } from 'neverthrow';
import { Album } from '../entities/album.js';
import { AlbumId, UserId } from '../value-objects/ids.js';

export interface AlbumRepositoryError extends Error {
  name: 'AlbumRepositoryError';
}

export interface AlbumRepository {
  save(album: Album): Promise<Result<void, AlbumRepositoryError>>;
  findById(id: AlbumId): Promise<Result<Album | null, AlbumRepositoryError>>;
  findByUserId(userId: UserId): Promise<Result<Album[], AlbumRepositoryError>>;
  findAll(): Promise<Result<Album[], AlbumRepositoryError>>;
  delete(id: AlbumId): Promise<Result<void, AlbumRepositoryError>>;
}