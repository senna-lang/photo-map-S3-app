/**
 * ユーザーIDを表す値オブジェクト
 * UUID形式の検証を含む
 */

import { Result, ok, err } from 'neverthrow';
import { ValidationError } from '../errors';

type Branded<T, B> = T & { _brand: B };
type UserIdValue = Branded<string, 'UserId'>;

export class UserId {
  private constructor(private readonly _value: UserIdValue) {}

  static create(id: string): Result<UserId, ValidationError> {
    // UUID形式の検証
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return err(new ValidationError(`Invalid UUID format for UserId: ${id}`));
    }

    return ok(new UserId(id as UserIdValue));
  }

  static generate(): UserId {
    // UUIDv4の生成
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );

    return new UserId(uuid as UserIdValue);
  }

  get value(): string {
    return this._value;
  }

  /**
   * 等価性チェック
   */
  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }

  /**
   * JSON表現
   */
  toJSON(): string {
    return this._value;
  }
}
