/**
 * ドメイン層のエラー型定義
 * neverthrowのResultパターンで使用するエラー型
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly message: string;
}

/**
 * 値オブジェクトの検証エラー
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 座標の範囲エラー
 */
export class CoordinateOutOfBoundsError extends ValidationError {
  readonly code = 'COORDINATE_OUT_OF_BOUNDS';
  
  constructor(coordinate: string, value: number, min: number, max: number) {
    super(`${coordinate} ${value} is out of bounds. Must be between ${min} and ${max}`);
    this.name = 'CoordinateOutOfBoundsError';
  }
}

/**
 * 無効なURL形式エラー
 */
export class InvalidUrlFormatError extends ValidationError {
  readonly code = 'INVALID_URL_FORMAT';
  
  constructor(url: string) {
    super(`Invalid URL format: ${url}`);
    this.name = 'InvalidUrlFormatError';
  }
}

/**
 * エンティティの検証エラー
 */
export class EntityValidationError extends DomainError {
  readonly code = 'ENTITY_VALIDATION_ERROR';
  
  constructor(entityName: string, message: string) {
    super(`${entityName} validation failed: ${message}`);
    this.name = 'EntityValidationError';
  }
}

/**
 * エンティティが見つからないエラー
 */
export class EntityNotFoundError extends DomainError {
  readonly code = 'ENTITY_NOT_FOUND';
  
  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`);
    this.name = 'EntityNotFoundError';
  }
}

/**
 * 認可エラー
 */
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}