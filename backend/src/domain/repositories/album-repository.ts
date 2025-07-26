/**
 * アルバムリポジトリインターフェース
 * DDDのリポジトリパターンに従い、ドメイン層でインターフェースを定義
 */

import { Result } from 'neverthrow';
import { Album } from '../entities';
import { AlbumId, UserId } from '../value-objects';
import { EntityNotFoundError } from '../errors';

export interface AlbumRepository {
  /**
   * アルバムを保存する
   */
  save(album: Album): Promise<Result<void, Error>>;

  /**
   * IDでアルバムを検索する
   */
  findById(id: AlbumId): Promise<Result<Album | null, Error>>;

  /**
   * ユーザーIDでアルバムを検索する
   */
  findByUserId(userId: UserId): Promise<Result<Album[], Error>>;

  /**
   * 全てのアルバムを取得する
   */
  findAll(): Promise<Result<Album[], Error>>;

  /**
   * アルバムを削除する
   */
  delete(id: AlbumId): Promise<Result<void, EntityNotFoundError | Error>>;

  /**
   * アルバムが存在するかチェックする
   */
  exists(id: AlbumId): Promise<Result<boolean, Error>>;

  /**
   * ユーザーのアルバム数を取得する
   */
  countByUserId(userId: UserId): Promise<Result<number, Error>>;
}
