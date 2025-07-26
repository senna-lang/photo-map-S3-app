/**
 * Drizzle ORMを使用したUserRepositoryの実装
 * ドメインエンティティとデータベースレコード間の変換を担当
 */

import { Result, ok, err } from 'neverthrow';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { UserRepository } from '../../domain/repositories/user-repository';
import { User } from '../../domain/entities/user';
import { UserId } from '../../domain/value-objects';
import { EntityNotFoundError } from '../../domain/errors';
import { users, type User as DbUser } from '../database/schema';

export class DrizzleUserRepository implements UserRepository {
  constructor(private db: PostgresJsDatabase<any>) {}

  /**
   * ユーザーを保存する
   */
  async save(user: User): Promise<Result<void, Error>> {
    try {
      const dbUser = this.toDbRecord(user);

      // upsert操作（存在する場合は更新、しない場合は挿入）
      await this.db
        .insert(users)
        .values(dbUser)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            username: dbUser.username,
            avatarUrl: dbUser.avatarUrl,
            name: dbUser.name,
            updatedAt: new Date(),
          },
        });

      return ok(undefined);
    } catch (error) {
      return err(
        new Error(
          `Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * IDでユーザーを検索する
   */
  async findById(id: UserId): Promise<Result<User | null, Error>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id.value))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const userResult = this.toDomainEntity(result[0]);
      if (userResult.isErr()) {
        return err(userResult.error);
      }

      return ok(userResult.value);
    } catch (error) {
      return err(
        new Error(
          `Failed to find user by id: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * GitHubIDでユーザーを検索する
   */
  async findByGitHubId(githubId: string): Promise<Result<User | null, Error>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.githubId, githubId))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const userResult = this.toDomainEntity(result[0]);
      if (userResult.isErr()) {
        return err(userResult.error);
      }

      return ok(userResult.value);
    } catch (error) {
      return err(
        new Error(
          `Failed to find user by GitHub id: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * ユーザー名でユーザーを検索する
   */
  async findByUsername(username: string): Promise<Result<User | null, Error>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const userResult = this.toDomainEntity(result[0]);
      if (userResult.isErr()) {
        return err(userResult.error);
      }

      return ok(userResult.value);
    } catch (error) {
      return err(
        new Error(
          `Failed to find user by username: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * ユーザーを削除する
   */
  async delete(id: UserId): Promise<Result<void, EntityNotFoundError | Error>> {
    try {
      const result = await this.db
        .delete(users)
        .where(eq(users.id, id.value))
        .returning({ id: users.id });

      if (result.length === 0) {
        return err(new EntityNotFoundError('User', id.value));
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new Error(
          `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * ユーザーが存在するかチェックする
   */
  async exists(id: UserId): Promise<Result<boolean, Error>> {
    try {
      const result = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, id.value))
        .limit(1);

      return ok(result.length > 0);
    } catch (error) {
      return err(
        new Error(
          `Failed to check user existence: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * GitHubIDでユーザーが存在するかチェックする
   */
  async existsByGitHubId(githubId: string): Promise<Result<boolean, Error>> {
    try {
      const result = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.githubId, githubId))
        .limit(1);

      return ok(result.length > 0);
    } catch (error) {
      return err(
        new Error(
          `Failed to check user existence by GitHub id: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * ドメインエンティティをデータベースレコードに変換
   */
  private toDbRecord(user: User): typeof users.$inferInsert {
    return {
      id: user.id.value,
      githubId: user.githubId,
      username: user.username,
      avatarUrl: user.avatarUrl,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * データベースレコードをドメインエンティティに変換
   */
  private toDomainEntity(record: DbUser): Result<User, Error> {
    try {
      // UserIdの生成
      const userIdResult = UserId.create(record.id);
      if (userIdResult.isErr()) {
        return err(new Error(`Invalid user ID: ${userIdResult.error.message}`));
      }

      // Userエンティティの再構築
      const user = User.reconstruct(
        userIdResult.value,
        record.githubId,
        record.username,
        record.avatarUrl,
        record.name,
        record.createdAt,
        record.updatedAt
      );

      return ok(user);
    } catch (error) {
      return err(
        new Error(
          `Failed to convert database record to domain entity: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }
}
