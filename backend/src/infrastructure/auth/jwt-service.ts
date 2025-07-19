import { Result, ok, err } from 'neverthrow';
import jwt from 'jsonwebtoken';
import { UserId } from '../../domain/value-objects/ids.js';

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export class JwtAuthError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'JwtAuthError';
  }
}

export class JwtService {
  private readonly secretKey: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.secretKey = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  generateAccessToken(userId: UserId): Result<string, JwtAuthError> {
    try {
      const payload: JwtPayload = {
        userId: userId.value,
      };

      const token = jwt.sign(payload, this.secretKey, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'photo-map-api',
        audience: 'photo-map-client',
      });

      return ok(token);
    } catch (error) {
      return err(new JwtAuthError(
        'Failed to generate access token',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  generateRefreshToken(userId: UserId): Result<string, JwtAuthError> {
    try {
      const payload: JwtPayload = {
        userId: userId.value,
      };

      const token = jwt.sign(payload, this.secretKey, {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'photo-map-api',
        audience: 'photo-map-client',
      });

      return ok(token);
    } catch (error) {
      return err(new JwtAuthError(
        'Failed to generate refresh token',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  verifyToken(token: string): Result<JwtPayload, JwtAuthError> {
    try {
      const decoded = jwt.verify(token, this.secretKey, {
        issuer: 'photo-map-api',
        audience: 'photo-map-client',
      }) as JwtPayload;

      return ok(decoded);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return err(new JwtAuthError('Token has expired'));
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        return err(new JwtAuthError('Invalid token'));
      }

      return err(new JwtAuthError(
        'Failed to verify token',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  extractUserIdFromToken(token: string): Result<UserId, JwtAuthError> {
    return this.verifyToken(token)
      .andThen(payload => {
        const userIdResult = UserId.create(payload.userId);
        if (userIdResult.isErr()) {
          return err(new JwtAuthError(`Invalid user ID in token: ${userIdResult.error.message}`));
        }
        return ok(userIdResult.value);
      });
  }
}