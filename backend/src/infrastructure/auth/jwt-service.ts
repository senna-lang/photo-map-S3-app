/**
 * JWT認証サービス
 * JWTトークンの生成・検証を行う
 */

import { Result, ok, err } from 'neverthrow';
import { sign, verify, JwtPayload } from 'jsonwebtoken';
import { UserId } from '../../domain/value-objects';

export interface TokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export class JwtService {
  constructor(private readonly config: JwtConfig) {}

  /**
   * JWTトークンを生成する
   */
  generateToken(userId: UserId): Result<string, Error> {
    try {
      const payload: TokenPayload = {
        userId: userId.value,
      };

      const token = sign(payload, this.config.secret, {
        expiresIn: this.config.expiresIn,
      } as any);

      return ok(token);
    } catch (error) {
      return err(new Error(`Failed to generate token: ${error}`));
    }
  }

  /**
   * JWTトークンを検証する
   */
  verifyToken(token: string): Result<TokenPayload, Error> {
    try {
      const decoded = verify(token, this.config.secret) as JwtPayload;

      if (typeof decoded === 'string') {
        return err(new Error('Invalid token payload'));
      }

      if (!decoded.userId) {
        return err(new Error('Missing userId in token'));
      }

      return ok({
        userId: decoded.userId,
        iat: decoded.iat,
        exp: decoded.exp,
      });
    } catch (error) {
      return err(new Error(`Token verification failed: ${error}`));
    }
  }

  /**
   * トークンの有効期限をチェックする
   */
  isTokenExpired(payload: TokenPayload): boolean {
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  }
}
