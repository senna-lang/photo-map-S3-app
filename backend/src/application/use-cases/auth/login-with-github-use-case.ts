/**
 * GitHubログインユースケース
 * GitHubのOAuth認証を使ってユーザーをログインさせる
 */

import { Result, ok, err } from 'neverthrow';
import { User } from '../../../domain/entities';
import { UserRepository } from '../../../domain/repositories';
import { GitHubOAuthService, JwtService } from '../../../infrastructure/auth';

export interface LoginWithGitHubRequest {
  code: string;
  state?: string;
}

export interface LoginWithGitHubResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}

export class LoginWithGitHubUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly gitHubService: GitHubOAuthService,
    private readonly jwtService: JwtService
  ) {}

  async execute(
    request: LoginWithGitHubRequest
  ): Promise<Result<LoginWithGitHubResponse, Error>> {
    // GitHub認証
    const gitHubUserResult = await this.gitHubService.authenticate(
      request.code
    );
    if (gitHubUserResult.isErr()) {
      return err(
        new Error(
          `GitHub authentication failed: ${gitHubUserResult.error.message}`
        )
      );
    }

    const gitHubUser = gitHubUserResult.value;

    // 既存ユーザーをチェック
    const existingUserResult = await this.userRepository.findByGitHubId(
      gitHubUser.id
    );
    if (existingUserResult.isErr()) {
      return err(
        new Error(
          `Failed to check existing user: ${existingUserResult.error.message}`
        )
      );
    }

    let user: User;
    let isNewUser: boolean;

    if (existingUserResult.value) {
      // 既存ユーザーの場合、プロフィール更新
      user = existingUserResult.value;
      isNewUser = false;

      const updateResult = user.updateProfile(
        gitHubUser.login,
        gitHubUser.avatar_url || undefined,
        gitHubUser.name || undefined
      );

      if (updateResult.isErr()) {
        return err(
          new Error(
            `Failed to update user profile: ${updateResult.error.message}`
          )
        );
      }

      const saveResult = await this.userRepository.save(user);
      if (saveResult.isErr()) {
        return err(
          new Error(`Failed to save updated user: ${saveResult.error.message}`)
        );
      }
    } else {
      // 新規ユーザーの場合、作成
      const createUserResult = User.create(
        gitHubUser.id,
        gitHubUser.login,
        gitHubUser.avatar_url || undefined,
        gitHubUser.name || undefined
      );

      if (createUserResult.isErr()) {
        return err(
          new Error(`Failed to create user: ${createUserResult.error.message}`)
        );
      }

      user = createUserResult.value;
      isNewUser = true;

      const saveResult = await this.userRepository.save(user);
      if (saveResult.isErr()) {
        return err(
          new Error(`Failed to save new user: ${saveResult.error.message}`)
        );
      }
    }

    // JWTトークン生成
    const tokenResult = this.jwtService.generateToken(user.id);
    if (tokenResult.isErr()) {
      return err(
        new Error(`Failed to generate token: ${tokenResult.error.message}`)
      );
    }

    return ok({
      user,
      token: tokenResult.value,
      isNewUser,
    });
  }
}
