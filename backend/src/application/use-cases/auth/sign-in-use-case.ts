import { Result, ok, err } from 'neverthrow';
import { UserRepository } from '../../../domain/repositories/user-repository.js';
import { User as UserEntity } from '../../../domain/entities/user.js';
import { GitHubOAuthService } from '../../../infrastructure/auth/github-oauth-service.js';
import { JwtService } from '../../../infrastructure/auth/jwt-service.js';
import type { AuthResponse } from '../../../schemas/index.js';

export class SignInUseCaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'SignInUseCaseError';
  }
}

export class SignInUseCase {
  constructor(
    private userRepository: UserRepository,
    private githubOAuthService: GitHubOAuthService,
    private jwtService: JwtService
  ) {}

  async execute(code: string): Promise<Result<AuthResponse, SignInUseCaseError>> {
    // Authenticate with GitHub
    const profileResult = await this.githubOAuthService.authenticateWithCode(code);
    if (profileResult.isErr()) {
      return err(new SignInUseCaseError(
        'GitHub authentication failed',
        profileResult.error
      ));
    }

    const profile = profileResult.value;

    // Find or create user
    const userResult = await this.findOrCreateUser(profile);
    if (userResult.isErr()) {
      return err(userResult.error);
    }

    const user = userResult.value;

    // Generate tokens
    const accessTokenResult = this.jwtService.generateAccessToken(user.id);
    if (accessTokenResult.isErr()) {
      return err(new SignInUseCaseError(
        'Failed to generate access token',
        accessTokenResult.error
      ));
    }

    const refreshTokenResult = this.jwtService.generateRefreshToken(user.id);
    if (refreshTokenResult.isErr()) {
      return err(new SignInUseCaseError(
        'Failed to generate refresh token',
        refreshTokenResult.error
      ));
    }

    return ok({
      user: this.toUserDto(user),
      accessToken: accessTokenResult.value,
      refreshToken: refreshTokenResult.value,
    });
  }

  private async findOrCreateUser(profile: any): Promise<Result<UserEntity, SignInUseCaseError>> {
    // Try to find existing user by GitHub ID
    const existingUserResult = await this.userRepository.findByGithubId(profile.id);
    if (existingUserResult.isErr()) {
      return err(new SignInUseCaseError(
        'Failed to search for existing user',
        existingUserResult.error
      ));
    }

    if (existingUserResult.value) {
      const existingUser = existingUserResult.value;
      
      // Update user profile if needed
      const updateResult = existingUser.updateProfile(
        profile.login,
        profile.avatar_url,
        profile.name
      );
      
      if (updateResult.isErr()) {
        return err(new SignInUseCaseError(
          'Failed to update user profile',
          updateResult.error
        ));
      }

      // Save updated user
      const saveResult = await this.userRepository.save(existingUser);
      if (saveResult.isErr()) {
        return err(new SignInUseCaseError(
          'Failed to save updated user',
          saveResult.error
        ));
      }

      return ok(existingUser);
    }

    // Create new user
    const newUserResult = UserEntity.create(
      profile.id,
      profile.login,
      profile.avatar_url,
      profile.name
    );

    if (newUserResult.isErr()) {
      return err(new SignInUseCaseError(
        'Failed to create new user',
        newUserResult.error
      ));
    }

    const newUser = newUserResult.value;

    // Save new user
    const saveResult = await this.userRepository.save(newUser);
    if (saveResult.isErr()) {
      return err(new SignInUseCaseError(
        'Failed to save new user',
        saveResult.error
      ));
    }

    return ok(newUser);
  }

  private toUserDto(user: UserEntity) {
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