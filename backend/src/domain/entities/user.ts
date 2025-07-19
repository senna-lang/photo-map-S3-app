import { Result, ok, err } from 'neverthrow';
import { UserId } from '../value-objects/ids.js';

export class UserDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserDomainError';
  }
}

export interface UserProps {
  id: UserId;
  githubId: string;
  username: string;
  avatarUrl?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(
    githubId: string,
    username: string,
    avatarUrl?: string,
    name?: string,
    id?: UserId,
    createdAt?: Date,
    updatedAt?: Date
  ): Result<User, UserDomainError> {
    if (!githubId || githubId.trim().length === 0) {
      return err(new UserDomainError('GitHub ID cannot be empty'));
    }

    if (!username || username.trim().length === 0) {
      return err(new UserDomainError('Username cannot be empty'));
    }

    if (username.length > 255) {
      return err(new UserDomainError('Username cannot be longer than 255 characters'));
    }

    if (avatarUrl && avatarUrl.length > 500) {
      return err(new UserDomainError('Avatar URL cannot be longer than 500 characters'));
    }

    if (name && name.length > 255) {
      return err(new UserDomainError('Name cannot be longer than 255 characters'));
    }

    const now = new Date();
    const userProps: UserProps = {
      id: id || UserId.generate(),
      githubId: githubId.trim(),
      username: username.trim(),
      avatarUrl: avatarUrl?.trim(),
      name: name?.trim(),
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    };

    return ok(new User(userProps));
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get id(): UserId {
    return this.props.id;
  }

  get githubId(): string {
    return this.props.githubId;
  }

  get username(): string {
    return this.props.username;
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateProfile(username?: string, avatarUrl?: string, name?: string): Result<void, UserDomainError> {
    if (username !== undefined) {
      if (!username || username.trim().length === 0) {
        return err(new UserDomainError('Username cannot be empty'));
      }
      if (username.length > 255) {
        return err(new UserDomainError('Username cannot be longer than 255 characters'));
      }
      this.props.username = username.trim();
    }

    if (avatarUrl !== undefined) {
      if (avatarUrl.length > 500) {
        return err(new UserDomainError('Avatar URL cannot be longer than 500 characters'));
      }
      this.props.avatarUrl = avatarUrl.trim() || undefined;
    }

    if (name !== undefined) {
      if (name.length > 255) {
        return err(new UserDomainError('Name cannot be longer than 255 characters'));
      }
      this.props.name = name.trim() || undefined;
    }

    this.props.updatedAt = new Date();
    return ok(undefined);
  }
}