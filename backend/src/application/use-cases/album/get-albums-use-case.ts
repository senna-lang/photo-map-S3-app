/**
 * アルバム一覧取得ユースケース
 * ユーザーのアルバムまたは全てのアルバムを取得する
 */

import { Result, ok, err } from 'neverthrow';
import { Album } from '../../../domain/entities';
import { UserId } from '../../../domain/value-objects';
import { AlbumRepository } from '../../../domain/repositories';

export interface GetAlbumsRequest {
  userId?: string; // 指定されない場合は全てのアルバムを取得
}

export interface GetAlbumsResponse {
  albums: Album[];
}

export class GetAlbumsUseCase {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(
    request: GetAlbumsRequest = {}
  ): Promise<Result<GetAlbumsResponse, Error>> {
    let albumsResult: Result<Album[], Error>;

    if (request.userId) {
      // 特定ユーザーのアルバムを取得
      const userIdResult = UserId.create(request.userId);
      if (userIdResult.isErr()) {
        return err(new Error(`Invalid user ID: ${userIdResult.error.message}`));
      }

      albumsResult = await this.albumRepository.findByUserId(
        userIdResult.value
      );
    } else {
      // 全てのアルバムを取得
      albumsResult = await this.albumRepository.findAll();
    }

    if (albumsResult.isErr()) {
      return err(
        new Error(`Failed to get albums: ${albumsResult.error.message}`)
      );
    }

    return ok({
      albums: albumsResult.value,
    });
  }
}
