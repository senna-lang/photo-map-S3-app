import { Result } from 'neverthrow';
import { User } from '../entities/user.js';
import { UserId } from '../value-objects/ids.js';

export interface UserRepositoryError extends Error {
  name: 'UserRepositoryError';
}

export interface UserRepository {
  save(user: User): Promise<Result<void, UserRepositoryError>>;
  findById(id: UserId): Promise<Result<User | null, UserRepositoryError>>;
  findByGithubId(githubId: string): Promise<Result<User | null, UserRepositoryError>>;
  findByUsername(username: string): Promise<Result<User | null, UserRepositoryError>>;
}