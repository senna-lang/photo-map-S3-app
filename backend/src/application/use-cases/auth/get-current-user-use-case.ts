import { Result, ok, err } from 'neverthrow';
import { UserRepository } from '../../../domain/repositories/user-repository.js';
import { User as UserEntity } from '../../../domain/entities/user.js';
import { UserId } from '../../../domain/value-objects/ids.js';
import type { User } from '../../../schemas/index.js';

export class GetCurrentUserUseCaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'GetCurrentUserUseCaseError';
  }
}

export class GetCurrentUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: UserId): Promise<Result<User, GetCurrentUserUseCaseError>> {
    const userResult = await this.userRepository.findById(userId);
    
    if (userResult.isErr()) {
      return err(new GetCurrentUserUseCaseError(
        'Failed to find user',
        userResult.error
      ));
    }

    const user = userResult.value;
    if (!user) {
      return err(new GetCurrentUserUseCaseError('User not found'));
    }

    return ok(this.toDto(user));
  }

  private toDto(user: UserEntity): User {
    return {
      id: user.id.value,
      githubId: user.githubId,
      username: user.username,
      avatarUrl: user.avatarUrl,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}