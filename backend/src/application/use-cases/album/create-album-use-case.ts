import { Result, ok, err } from 'neverthrow';
import { AlbumRepository } from '../../../domain/repositories/album-repository.js';
import { Album as AlbumEntity } from '../../../domain/entities/album.js';
import { Coordinate } from '../../../domain/value-objects/coordinate.js';
import { ImageUrl } from '../../../domain/value-objects/image-url.js';
import { UserId } from '../../../domain/value-objects/ids.js';
import type { CreateAlbumRequest, Album } from '../../../schemas/index.js';

export class CreateAlbumUseCaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'CreateAlbumUseCaseError';
  }
}

export class CreateAlbumUseCase {
  constructor(private albumRepository: AlbumRepository) {}

  async execute(
    request: CreateAlbumRequest, 
    userId: UserId
  ): Promise<Result<Album, CreateAlbumUseCaseError>> {
    // Create coordinate value object
    const coordinateResult = Coordinate.create(
      request.coordinate.lng,
      request.coordinate.lat
    );
    if (coordinateResult.isErr()) {
      return err(new CreateAlbumUseCaseError(
        `Invalid coordinate: ${coordinateResult.error.message}`,
        coordinateResult.error
      ));
    }

    // Create image URL value objects
    const imageUrlResults = request.imageUrls.map(url => ImageUrl.create(url));
    const failedImageUrl = imageUrlResults.find(result => result.isErr());
    if (failedImageUrl) {
      return err(new CreateAlbumUseCaseError(
        `Invalid image URL: ${failedImageUrl.error.message}`,
        failedImageUrl.error
      ));
    }

    const imageUrls = imageUrlResults.map(result => result.value);

    // Create album entity
    const albumResult = AlbumEntity.create(
      coordinateResult.value,
      imageUrls,
      userId
    );
    if (albumResult.isErr()) {
      return err(new CreateAlbumUseCaseError(
        `Failed to create album: ${albumResult.error.message}`,
        albumResult.error
      ));
    }

    // Save album
    const saveResult = await this.albumRepository.save(albumResult.value);
    if (saveResult.isErr()) {
      return err(new CreateAlbumUseCaseError(
        'Failed to save album',
        saveResult.error
      ));
    }

    return ok(this.toDto(albumResult.value));
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