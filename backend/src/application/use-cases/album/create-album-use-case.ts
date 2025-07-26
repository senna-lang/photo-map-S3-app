/**
 * アルバム作成ユースケース
 * 新しいアルバムを作成する
 */

import { Result, ok, err } from 'neverthrow';
import { Album } from '../../../domain/entities';
import { Coordinate, ImageUrl, UserId } from '../../../domain/value-objects';
import { AlbumRepository } from '../../../domain/repositories';

export interface CreateAlbumRequest {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  imageUrls: string[];
  userId: string;
}

export interface CreateAlbumResponse {
  album: Album;
}

export class CreateAlbumUseCase {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async execute(
    request: CreateAlbumRequest
  ): Promise<Result<CreateAlbumResponse, Error>> {
    // 値オブジェクトの作成と検証
    const coordinateResult = Coordinate.create(
      request.coordinate.latitude,
      request.coordinate.longitude
    );
    if (coordinateResult.isErr()) {
      return err(
        new Error(`Invalid coordinate: ${coordinateResult.error.message}`)
      );
    }

    const userIdResult = UserId.create(request.userId);
    if (userIdResult.isErr()) {
      return err(new Error(`Invalid user ID: ${userIdResult.error.message}`));
    }

    // 画像URLの値オブジェクト配列を作成
    const imageUrlResults = request.imageUrls.map((url) =>
      ImageUrl.create(url)
    );
    const failedImageUrl = imageUrlResults.find((result) => result.isErr());
    if (failedImageUrl && failedImageUrl.isErr()) {
      return err(
        new Error(`Invalid image URL: ${failedImageUrl.error.message}`)
      );
    }

    const imageUrls: ImageUrl[] = [];
    for (const result of imageUrlResults) {
      if (result.isOk()) {
        imageUrls.push(result.value);
      }
    }

    // アルバムエンティティの作成
    const albumResult = Album.create(
      coordinateResult.value,
      imageUrls,
      userIdResult.value
    );

    if (albumResult.isErr()) {
      return err(
        new Error(`Failed to create album: ${albumResult.error.message}`)
      );
    }

    const album = albumResult.value;

    // アルバムを保存
    const saveResult = await this.albumRepository.save(album);
    if (saveResult.isErr()) {
      return err(
        new Error(`Failed to save album: ${saveResult.error.message}`)
      );
    }

    return ok({
      album,
    });
  }
}
