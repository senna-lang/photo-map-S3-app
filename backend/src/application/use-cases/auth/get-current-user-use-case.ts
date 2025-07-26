/**
 * 現在のユーザー取得ユースケース
 * JWTトークンから現在のユーザー情報を取得する
 */

import { Result, ok, err } from 'neverthrow';
import { User } from '../../../domain/entities';
import { UserId } from '../../../domain/value-objects';
import { UserRepository } from '../../../domain/repositories';
import { JwtService } from '../../../infrastructure/auth';

export interface GetCurrentUserRequest {
  token: string;
}

export interface GetCurrentUserResponse {
  user: User;
}

export class GetCurrentUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async execute(
    request: GetCurrentUserRequest
  ): Promise<Result<GetCurrentUserResponse, Error>> {
    // JWTトークンを検証
    const tokenResult = this.jwtService.verifyToken(request.token);
    if (tokenResult.isErr()) {
      return err(new Error(`Invalid token: ${tokenResult.error.message}`));
    }

    const payload = tokenResult.value;

    // トークンの有効期限チェック
    if (this.jwtService.isTokenExpired(payload)) {
      return err(new Error('Token has expired'));
    }

    // ユーザーIDを値オブジェクトに変換
    const userIdResult = UserId.create(payload.userId);
    if (userIdResult.isErr()) {
      return err(new Error(`Invalid user ID: ${userIdResult.error.message}`));
    }

    const userId = userIdResult.value;

    // ユーザーを取得
    const userResult = await this.userRepository.findById(userId);
    if (userResult.isErr()) {
      return err(new Error(`Failed to find user: ${userResult.error.message}`));
    }

    const user = userResult.value;
    if (!user) {
      return err(new Error('User not found'));
    }

    return ok({
      user,
    });
  }
}
