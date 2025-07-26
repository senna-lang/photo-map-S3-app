/**
 * ユーザーエンティティ
 * GitHubアカウントと連携したユーザー情報を表すドメインオブジェクト
 */

import { Result, ok, err } from 'neverthrow';
import { UserId } from '../value-objects';
import { EntityValidationError } from '../errors';

type Branded<T, B> = T & { _brand: B };
type GitHubId = Branded<string, 'GitHubId'>;
type Username = Branded<string, 'Username'>;
type AvatarUrl = Branded<string, 'AvatarUrl'>;

export class User {
  private constructor(
    private readonly _id: UserId,
    private readonly _githubId: GitHubId,
    private _username: Username,
    private _avatarUrl: AvatarUrl | null,
    private _name: string | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(
    githubId: string,
    username: string,
    avatarUrl?: string,
    name?: string
  ): Result<User, EntityValidationError> {
    // GitHubIDの検証
    if (!githubId || githubId.trim().length === 0) {
      return err(new EntityValidationError('User', 'GitHub ID is required'));
    }

    // ユーザー名の検証
    if (!username || username.trim().length === 0) {
      return err(new EntityValidationError('User', 'Username is required'));
    }

    if (username.length > 39) {
      // GitHubの最大ユーザー名長
      return err(
        new EntityValidationError(
          'User',
          'Username must be 39 characters or less'
        )
      );
    }

    // GitHubユーザー名の形式検証（英数字とハイフンのみ）
    const usernameRegex = /^[a-zA-Z0-9-]+$/;
    if (!usernameRegex.test(username)) {
      return err(
        new EntityValidationError(
          'User',
          'Username can only contain alphanumeric characters and hyphens'
        )
      );
    }

    // アバターURLの検証
    let validatedAvatarUrl: AvatarUrl | null = null;
    if (avatarUrl) {
      try {
        new URL(avatarUrl); // URL形式の検証
        validatedAvatarUrl = avatarUrl as AvatarUrl;
      } catch {
        return err(
          new EntityValidationError('User', 'Invalid avatar URL format')
        );
      }
    }

    const now = new Date();
    return ok(
      new User(
        UserId.generate(),
        githubId as GitHubId,
        username as Username,
        validatedAvatarUrl,
        name || null,
        now,
        now
      )
    );
  }

  static reconstruct(
    id: UserId,
    githubId: string,
    username: string,
    avatarUrl: string | null,
    name: string | null,
    createdAt: Date,
    updatedAt: Date
  ): User {
    return new User(
      id,
      githubId as GitHubId,
      username as Username,
      avatarUrl as AvatarUrl | null,
      name,
      createdAt,
      updatedAt
    );
  }

  // ゲッター
  get id(): UserId {
    return this._id;
  }

  get githubId(): string {
    return this._githubId;
  }

  get username(): string {
    return this._username;
  }

  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  get name(): string | null {
    return this._name;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime()); // 防御的コピー
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt.getTime()); // 防御的コピー
  }

  /**
   * プロフィール情報を更新する
   */
  updateProfile(
    username?: string,
    avatarUrl?: string,
    name?: string
  ): Result<void, EntityValidationError> {
    // ユーザー名の更新
    if (username !== undefined) {
      if (!username || username.trim().length === 0) {
        return err(new EntityValidationError('User', 'Username is required'));
      }

      if (username.length > 39) {
        return err(
          new EntityValidationError(
            'User',
            'Username must be 39 characters or less'
          )
        );
      }

      const usernameRegex = /^[a-zA-Z0-9-]+$/;
      if (!usernameRegex.test(username)) {
        return err(
          new EntityValidationError(
            'User',
            'Username can only contain alphanumeric characters and hyphens'
          )
        );
      }

      this._username = username as Username;
    }

    // アバターURLの更新
    if (avatarUrl !== undefined) {
      if (avatarUrl === '') {
        this._avatarUrl = null;
      } else {
        try {
          new URL(avatarUrl);
          this._avatarUrl = avatarUrl as AvatarUrl;
        } catch {
          return err(
            new EntityValidationError('User', 'Invalid avatar URL format')
          );
        }
      }
    }

    // 名前の更新
    if (name !== undefined) {
      this._name = name === '' ? null : name;
    }

    this._updatedAt = new Date();
    return ok(undefined);
  }

  /**
   * 表示名を取得（name > username の優先順位）
   */
  get displayName(): string {
    return this._name || this._username;
  }

  /**
   * 等価性チェック（IDベース）
   */
  equals(other: User): boolean {
    return this._id.equals(other._id);
  }

  /**
   * GitHubIDでの等価性チェック
   */
  isSameGitHubUser(githubId: string): boolean {
    return this._githubId === githubId;
  }

  /**
   * JSON表現
   */
  toJSON(): {
    id: string;
    githubId: string;
    username: string;
    avatarUrl: string | null;
    name: string | null;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this._id.value,
      githubId: this._githubId,
      username: this._username,
      avatarUrl: this._avatarUrl,
      name: this._name,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}
