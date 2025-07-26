/**
 * ユーザーリポジトリインターフェース
 * DDDのリポジトリパターンに従い、ドメイン層でインターフェースを定義
 */

import { Result } from 'neverthrow';
import { User } from '../entities';
import { UserId } from '../value-objects';
import { EntityNotFoundError } from '../errors';

export interface UserRepository {
  /**
   * ユーザーを保存する
   */
  save(user: User): Promise<Result<void, Error>>;

  /**
   * IDでユーザーを検索する
   */
  findById(id: UserId): Promise<Result<User | null, Error>>;

  /**
   * GitHubIDでユーザーを検索する
   */
  findByGitHubId(githubId: string): Promise<Result<User | null, Error>>;

  /**
   * ユーザー名でユーザーを検索する
   */
  findByUsername(username: string): Promise<Result<User | null, Error>>;

  /**
   * ユーザーを削除する
   */
  delete(id: UserId): Promise<Result<void, EntityNotFoundError | Error>>;

  /**
   * ユーザーが存在するかチェックする
   */
  exists(id: UserId): Promise<Result<boolean, Error>>;

  /**
   * GitHubIDでユーザーが存在するかチェックする
   */
  existsByGitHubId(githubId: string): Promise<Result<boolean, Error>>;
}
