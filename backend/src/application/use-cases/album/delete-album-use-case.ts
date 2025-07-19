import { Result, ok, err } from 'neverthrow';
import { AlbumRepository } from '../../../domain/repositories/album-repository.js';
import { AlbumId, UserId } from '../../../domain/value-objects/ids.js';

export class DeleteAlbumUseCaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DeleteAlbumUseCaseError';
  }
}

export class DeleteAlbumUseCase {
  constructor(private albumRepository: AlbumRepository) {}

  async execute(
    albumId: string,
    userId: UserId
  ): Promise<Result<void, DeleteAlbumUseCaseError>> {
    // Validate album ID
    const albumIdResult = AlbumId.create(albumId);
    if (albumIdResult.isErr()) {
      return err(new DeleteAlbumUseCaseError(
        `Invalid album ID: ${albumIdResult.error.message}`,
        albumIdResult.error
      ));
    }

    // Check if album exists and get ownership
    const albumResult = await this.albumRepository.findById(albumIdResult.value);
    if (albumResult.isErr()) {
      return err(new DeleteAlbumUseCaseError(
        'Failed to find album',
        albumResult.error
      ));
    }

    const album = albumResult.value;
    if (!album) {
      return err(new DeleteAlbumUseCaseError('Album not found'));
    }

    // Check ownership
    if (!album.isOwnedBy(userId)) {
      return err(new DeleteAlbumUseCaseError('User does not own this album'));
    }

    // Delete album
    const deleteResult = await this.albumRepository.delete(albumIdResult.value);
    if (deleteResult.isErr()) {
      return err(new DeleteAlbumUseCaseError(
        'Failed to delete album',
        deleteResult.error
      ));
    }

    return ok(undefined);
  }
}