import { Result, ok, err } from 'neverthrow';
import { eq } from 'drizzle-orm';
import { Database } from '../database/connection.js';
import { users } from '../database/schema.js';
import { UserRepository, UserRepositoryError } from '../../domain/repositories/user-repository.js';
import { User } from '../../domain/entities/user.js';
import { UserId } from '../../domain/value-objects/ids.js';

export class DrizzleUserRepositoryError extends Error implements UserRepositoryError {
  name = 'UserRepositoryError' as const;
  
  constructor(message: string, public cause?: Error) {
    super(message);
  }
}

export class DrizzleUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async save(user: User): Promise<Result<void, UserRepositoryError>> {
    try {
      await this.db
        .insert(users)
        .values({
          id: user.id.value,
          githubId: user.githubId,
          username: user.username,
          avatarUrl: user.avatarUrl,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            username: user.username,
            avatarUrl: user.avatarUrl,
            name: user.name,
            updatedAt: user.updatedAt,
          },
        });

      return ok(undefined);
    } catch (error) {
      return err(new DrizzleUserRepositoryError(
        'Failed to save user',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  async findById(id: UserId): Promise<Result<User | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id.value))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const userData = result[0];
      const domainUser = this.toDomain(userData);
      
      return domainUser.match(
        user => ok(user),
        error => err(new DrizzleUserRepositoryError(`Failed to convert user data: ${error.message}`))
      );
    } catch (error) {
      return err(new DrizzleUserRepositoryError(
        'Failed to find user by id',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  async findByGithubId(githubId: string): Promise<Result<User | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.githubId, githubId))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const userData = result[0];
      const domainUser = this.toDomain(userData);
      
      return domainUser.match(
        user => ok(user),
        error => err(new DrizzleUserRepositoryError(`Failed to convert user data: ${error.message}`))
      );
    } catch (error) {
      return err(new DrizzleUserRepositoryError(
        'Failed to find user by GitHub ID',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  async findByUsername(username: string): Promise<Result<User | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const userData = result[0];
      const domainUser = this.toDomain(userData);
      
      return domainUser.match(
        user => ok(user),
        error => err(new DrizzleUserRepositoryError(`Failed to convert user data: ${error.message}`))
      );
    } catch (error) {
      return err(new DrizzleUserRepositoryError(
        'Failed to find user by username',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  private toDomain(data: any): Result<User, Error> {
    const userIdResult = UserId.create(data.id);
    if (userIdResult.isErr()) {
      return err(userIdResult.error);
    }

    return User.create(
      data.githubId,
      data.username,
      data.avatarUrl,
      data.name,
      userIdResult.value,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    ).mapErr(error => new Error(error.message));
  }
}