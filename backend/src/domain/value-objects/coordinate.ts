/**
 * 地理座標を表す値オブジェクト
 * 緯度経度の範囲検証を含む
 */

import { Result, ok, err } from 'neverthrow';
import { CoordinateOutOfBoundsError } from '../errors';

type Branded<T, B> = T & { _brand: B };
type Latitude = Branded<number, 'Latitude'>;
type Longitude = Branded<number, 'Longitude'>;

export class Coordinate {
  private constructor(
    private readonly _latitude: Latitude,
    private readonly _longitude: Longitude
  ) {}

  static create(
    latitude: number,
    longitude: number
  ): Result<Coordinate, CoordinateOutOfBoundsError> {
    // 緯度の範囲チェック (-90 to 90)
    if (latitude < -90 || latitude > 90) {
      return err(new CoordinateOutOfBoundsError('latitude', latitude, -90, 90));
    }

    // 経度の範囲チェック (-180 to 180)
    if (longitude < -180 || longitude > 180) {
      return err(
        new CoordinateOutOfBoundsError('longitude', longitude, -180, 180)
      );
    }

    return ok(new Coordinate(latitude as Latitude, longitude as Longitude));
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  /**
   * 2つの座標間の距離を計算（ハーバーサイン公式）
   */
  distanceTo(other: Coordinate): number {
    const R = 6371; // 地球の半径（km）
    const dLat = this.toRadians(other.latitude - this.latitude);
    const dLon = this.toRadians(other.longitude - this.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this.latitude)) *
        Math.cos(this.toRadians(other.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 座標の等価性チェック
   */
  equals(other: Coordinate): boolean {
    return (
      this.latitude === other.latitude && this.longitude === other.longitude
    );
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return `${this.latitude},${this.longitude}`;
  }

  /**
   * JSON表現
   */
  toJSON(): { latitude: number; longitude: number } {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }
}
