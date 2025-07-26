/**
 * アルバム削除ユースケース
 * アルバムを削除する（所有者のみ）
 */

import { Result, ok, err } from 'neverthrow';
import { AlbumId, UserId } from '../../../domain/value-objects';
import { AlbumRepository } from '../../../domain/repositories';
import { EntityNotFoundError, UnauthorizedError } from '../../../domain/errors';

export interface DeleteAlbumRequest {
  albumId: string;
  userId: string;
}

export interface DeleteAlbumResponse {
  success: boolean;
}

export class DeleteAlbumUseCase {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(
    request: DeleteAlbumRequest
  ): Promise<Result<DeleteAlbumResponse, Error>> {
    // 値オブジェクトの作成と検証
    const albumIdResult = AlbumId.create(request.albumId);
    if (albumIdResult.isErr()) {
      return err(new Error(`Invalid album ID: ${albumIdResult.error.message}`));
    }

    const userIdResult = UserId.create(request.userId);
    if (userIdResult.isErr()) {
      return err(new Error(`Invalid user ID: ${userIdResult.error.message}`));
    }

    const albumId = albumIdResult.value;
    const userId = userIdResult.value;

    // アルバムの存在確認
    const albumResult = await this.albumRepository.findById(albumId);
    if (albumResult.isErr()) {
      return err(
        new Error(`Failed to find album: ${albumResult.error.message}`)
      );
    }

    const album = albumResult.value;
    if (!album) {
      return err(new EntityNotFoundError('Album', albumId.value));
    }

    // 所有者確認
    if (!album.isOwnedBy(userId)) {
      return err(
        new UnauthorizedError('Only the album owner can delete this album')
      );
    }

    // アルバムを削除
    const deleteResult = await this.albumRepository.delete(albumId);
    if (deleteResult.isErr()) {
      return err(
        new Error(`Failed to delete album: ${deleteResult.error.message}`)
      );
    }

    return ok({
      success: true,
    });
  }
}
