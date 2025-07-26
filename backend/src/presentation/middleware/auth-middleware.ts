/**
 * JWT認証ミドルウェア
 * リクエストのAuthorizationヘッダーからJWTトークンを検証し、ユーザー情報をコンテキストに設定する
 */

import { Context, Next } from 'hono';
import { JwtService } from '../../infrastructure/auth';
import { UserId } from '../../domain/value-objects';

export interface AuthContext {
  userId: UserId;
}

declare module 'hono' {
  interface ContextVariableMap {
    user?: AuthContext;
  }
}

/**
 * 必須認証ミドルウェア
 * 認証が必要なエンドポイントで使用
 */
export function requireAuth(jwtService: JwtService) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header is required' }, 401);
    }

    const token = authHeader.substring(7); // "Bearer " を除去

    const tokenResult = jwtService.verifyToken(token);
    if (tokenResult.isErr()) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const payload = tokenResult.value;

    // トークンの有効期限チェック
    if (jwtService.isTokenExpired(payload)) {
      return c.json({ error: 'Token has expired' }, 401);
    }

    // ユーザーIDを値オブジェクトに変換
    const userIdResult = UserId.create(payload.userId);
    if (userIdResult.isErr()) {
      return c.json({ error: 'Invalid user ID in token' }, 401);
    }

    // コンテキストにユーザー情報を設定
    c.set('user', { userId: userIdResult.value });

    await next();
  };
}

/**
 * オプショナル認証ミドルウェア
 * 認証が任意のエンドポイントで使用
 */
export function optionalAuth(jwtService: JwtService) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      const tokenResult = jwtService.verifyToken(token);
      if (tokenResult.isOk()) {
        const payload = tokenResult.value;

        // 有効期限内かつ有効なユーザーIDの場合のみ設定
        if (!jwtService.isTokenExpired(payload)) {
          const userIdResult = UserId.create(payload.userId);
          if (userIdResult.isOk()) {
            c.set('user', { userId: userIdResult.value });
          }
        }
      }
    }

    await next();
  };
}
