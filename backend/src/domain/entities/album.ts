/**
 * アルバムエンティティ
 * 地理座標に関連付けられた写真集合を表すドメインオブジェクト
 */

import { Result, ok, err } from 'neverthrow';
import { AlbumId, Coordinate, ImageUrl, UserId } from '../value-objects';
import { EntityValidationError, UnauthorizedError } from '../errors';

export class Album {
  private constructor(
    private readonly _id: AlbumId,
    private readonly _coordinate: Coordinate,
    private _imageUrls: ImageUrl[],
    private readonly _userId: UserId,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(
    coordinate: Coordinate,
    imageUrls: ImageUrl[],
    userId: UserId
  ): Result<Album, EntityValidationError> {
    // ビジネスルールの検証
    if (imageUrls.length === 0) {
      return err(new EntityValidationError('Album', 'At least one image is required'));
    }

    if (imageUrls.length > 10) {
      return err(new EntityValidationError('Album', 'Maximum 10 images allowed per album'));
    }

    // 重複URLの検証
    const uniqueUrls = new Set(imageUrls.map(url => url.value));
    if (uniqueUrls.size !== imageUrls.length) {
      return err(new EntityValidationError('Album', 'Duplicate image URLs are not allowed'));
    }

    const now = new Date();
    return ok(new Album(
      AlbumId.generate(),
      coordinate,
      [...imageUrls], // 防御的コピー
      userId,
      now,
      now
    ));
  }

  static reconstruct(
    id: AlbumId,
    coordinate: Coordinate,
    imageUrls: ImageUrl[],
    userId: UserId,
    createdAt: Date,
    updatedAt: Date
  ): Album {
    return new Album(id, coordinate, imageUrls, userId, createdAt, updatedAt);
  }

  // ゲッター
  get id(): AlbumId {
    return this._id;
  }

  get coordinate(): Coordinate {
    return this._coordinate;
  }

  get imageUrls(): ReadonlyArray<ImageUrl> {
    return [...this._imageUrls]; // 防御的コピー
  }

  get userId(): UserId {
    return this._userId;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime()); // 防御的コピー
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt.getTime()); // 防御的コピー
  }

  /**
   * 画像を追加する
   */
  addImage(imageUrl: ImageUrl, requestUserId: UserId): Result<void, EntityValidationError | UnauthorizedError> {
    // 所有者チェック
    if (!this.isOwnedBy(requestUserId)) {
      return err(new UnauthorizedError('Only the album owner can add images'));
    }

    // 最大数チェック
    if (this._imageUrls.length >= 10) {
      return err(new EntityValidationError('Album', 'Maximum 10 images allowed per album'));
    }

    // 重複チェック
    if (this._imageUrls.some(url => url.equals(imageUrl))) {
      return err(new EntityValidationError('Album', 'Image URL already exists in album'));
    }

    this._imageUrls.push(imageUrl);
    this._updatedAt = new Date();
    return ok(undefined);
  }

  /**
   * 画像を削除する
   */
  removeImage(imageUrl: ImageUrl, requestUserId: UserId): Result<void, EntityValidationError | UnauthorizedError> {
    // 所有者チェック
    if (!this.isOwnedBy(requestUserId)) {
      return err(new UnauthorizedError('Only the album owner can remove images'));
    }

    const index = this._imageUrls.findIndex(url => url.equals(imageUrl));
    if (index === -1) {
      return err(new EntityValidationError('Album', 'Image URL not found in album'));
    }

    // 最後の画像は削除できない
    if (this._imageUrls.length === 1) {
      return err(new EntityValidationError('Album', 'Cannot remove the last image from album'));
    }

    this._imageUrls.splice(index, 1);
    this._updatedAt = new Date();
    return ok(undefined);
  }

  /**
   * 所有者確認
   */
  isOwnedBy(userId: UserId): boolean {
    return this._userId.equals(userId);
  }

  /**
   * 画像数を取得
   */
  get imageCount(): number {
    return this._imageUrls.length;
  }

  /**
   * 指定した座標からの距離を計算
   */
  distanceFrom(coordinate: Coordinate): number {
    return this._coordinate.distanceTo(coordinate);
  }

  /**
   * 等価性チェック（IDベース）
   */
  equals(other: Album): boolean {
    return this._id.equals(other._id);
  }

  /**
   * JSON表現
   */
  toJSON(): {
    id: string;
    coordinate: { latitude: number; longitude: number };
    imageUrls: string[];
    userId: string;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this._id.value,
      coordinate: this._coordinate.toJSON(),
      imageUrls: this._imageUrls.map(url => url.value),
      userId: this._userId.value,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}