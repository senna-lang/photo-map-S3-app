import { Result, ok, err } from 'neverthrow';

export class InvalidCoordinateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCoordinateError';
  }
}

export class Coordinate {
  private constructor(
    private readonly _lng: number,
    private readonly _lat: number
  ) {}

  static create(lng: number, lat: number): Result<Coordinate, InvalidCoordinateError> {
    if (lng < -180 || lng > 180) {
      return err(new InvalidCoordinateError(`Longitude must be between -180 and 180, got ${lng}`));
    }
    
    if (lat < -90 || lat > 90) {
      return err(new InvalidCoordinateError(`Latitude must be between -90 and 90, got ${lat}`));
    }

    return ok(new Coordinate(lng, lat));
  }

  get lng(): number {
    return this._lng;
  }

  get lat(): number {
    return this._lat;
  }

  equals(other: Coordinate): boolean {
    return this._lng === other._lng && this._lat === other._lat;
  }

  toObject(): { lng: number; lat: number } {
    return {
      lng: this._lng,
      lat: this._lat,
    };
  }
}