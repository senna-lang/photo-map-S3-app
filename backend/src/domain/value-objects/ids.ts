import { Result, ok, err } from 'neverthrow';
import { randomUUID } from 'crypto';

export class InvalidIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidIdError';
  }
}

abstract class Id {
  protected constructor(protected readonly _value: string) {}

  static validateUuid(value: string): Result<string, InvalidIdError> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      return err(new InvalidIdError(`Invalid UUID format: ${value}`));
    }
    
    return ok(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Id): boolean {
    return this._value === other._value;
  }
}

export class AlbumId extends Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): Result<AlbumId, InvalidIdError> {
    return Id.validateUuid(value).map(validValue => new AlbumId(validValue));
  }

  static generate(): AlbumId {
    return new AlbumId(randomUUID());
  }
}

export class UserId extends Id {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): Result<UserId, InvalidIdError> {
    return Id.validateUuid(value).map(validValue => new UserId(validValue));
  }

  static generate(): UserId {
    return new UserId(randomUUID());
  }
}