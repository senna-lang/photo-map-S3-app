import { Result, ok, err } from 'neverthrow';
import { AlbumRepository } from '../../../domain/repositories/album-repository.js';
import { Album as AlbumEntity } from '../../../domain/entities/album.js';
import type { Album } from '../../../schemas/index.js';

export class GetAllAlbumsUseCaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'GetAllAlbumsUseCaseError';
  }
}

export class GetAllAlbumsUseCase {
  constructor(private albumRepository: AlbumRepository) {}

  async execute(): Promise<Result<Album[], GetAllAlbumsUseCaseError>> {
    const albumsResult = await this.albumRepository.findAll();
    
    if (albumsResult.isErr()) {
      return err(new GetAllAlbumsUseCaseError(
        'Failed to retrieve albums',
        albumsResult.error
      ));
    }

    const albums = albumsResult.value.map(album => this.toDto(album));
    return ok(albums);
  }

  private toDto(album: AlbumEntity): Album {
    return {
      id: album.id.value,
      coordinate: album.coordinate.toObject(),
      imageUrls: album.imageUrls.map(url => url.value),
      userId: album.userId.value,
      createdAt: album.createdAt.toISOString(),
      updatedAt: album.updatedAt.toISOString(),
    };
  }
}