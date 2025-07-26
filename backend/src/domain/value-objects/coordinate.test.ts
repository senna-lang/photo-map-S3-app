/**
 * Coordinateクラスのテスト
 */

import { describe, it, expect } from 'vitest';
import { Coordinate } from './coordinate';
import { CoordinateOutOfBoundsError } from '../errors';

describe('Coordinate', () => {
  describe('create', () => {
    it('正常な緯度経度で作成される', () => {
      const result = Coordinate.create(35.6762, 139.6503); // 東京駅

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.latitude).toBe(35.6762);
        expect(result.value.longitude).toBe(139.6503);
      }
    });

    it('境界値で正常に作成される', () => {
      // 最大値
      const maxResult = Coordinate.create(90, 180);
      expect(maxResult.isOk()).toBe(true);

      // 最小値
      const minResult = Coordinate.create(-90, -180);
      expect(minResult.isOk()).toBe(true);
    });

    it('緯度が範囲外の場合エラーになる', () => {
      const result1 = Coordinate.create(91, 0);
      expect(result1.isErr()).toBe(true);
      if (result1.isErr()) {
        expect(result1.error).toBeInstanceOf(CoordinateOutOfBoundsError);
        expect(result1.error.message).toContain('latitude 91 is out of bounds');
      }

      const result2 = Coordinate.create(-91, 0);
      expect(result2.isErr()).toBe(true);
      if (result2.isErr()) {
        expect(result2.error).toBeInstanceOf(CoordinateOutOfBoundsError);
        expect(result2.error.message).toContain(
          'latitude -91 is out of bounds'
        );
      }
    });

    it('経度が範囲外の場合エラーになる', () => {
      const result1 = Coordinate.create(0, 181);
      expect(result1.isErr()).toBe(true);
      if (result1.isErr()) {
        expect(result1.error).toBeInstanceOf(CoordinateOutOfBoundsError);
        expect(result1.error.message).toContain(
          'longitude 181 is out of bounds'
        );
      }

      const result2 = Coordinate.create(0, -181);
      expect(result2.isErr()).toBe(true);
      if (result2.isErr()) {
        expect(result2.error).toBeInstanceOf(CoordinateOutOfBoundsError);
        expect(result2.error.message).toContain(
          'longitude -181 is out of bounds'
        );
      }
    });
  });

  describe('distanceTo', () => {
    it('同じ座標の場合距離は0', () => {
      const coord1Result = Coordinate.create(35.6762, 139.6503);
      if (coord1Result.isErr()) throw coord1Result.error;
      const coord1 = coord1Result.value;
      const coord2Result = Coordinate.create(35.6762, 139.6503);
      if (coord2Result.isErr()) throw coord2Result.error;
      const coord2 = coord2Result.value;

      const distance = coord1.distanceTo(coord2);
      expect(distance).toBe(0);
    });

    it('東京駅から新宿駅までの距離を正しく計算する', () => {
      const tokyoResult = Coordinate.create(35.6762, 139.6503);
      if (tokyoResult.isErr()) throw tokyoResult.error;
      const tokyo = tokyoResult.value; // 東京駅
      const shinjukuResult = Coordinate.create(35.6896, 139.7006);
      if (shinjukuResult.isErr()) throw shinjukuResult.error;
      const shinjuku = shinjukuResult.value; // 新宿駅

      const distance = tokyo.distanceTo(shinjuku);
      // 約4.8km程度の距離になるはず
      expect(distance).toBeGreaterThan(4);
      expect(distance).toBeLessThan(6);
    });
  });

  describe('equals', () => {
    it('同じ座標の場合trueを返す', () => {
      const coord1Result = Coordinate.create(35.6762, 139.6503);
      if (coord1Result.isErr()) throw coord1Result.error;
      const coord1 = coord1Result.value;
      const coord2Result = Coordinate.create(35.6762, 139.6503);
      if (coord2Result.isErr()) throw coord2Result.error;
      const coord2 = coord2Result.value;

      expect(coord1.equals(coord2)).toBe(true);
    });

    it('異なる座標の場合falseを返す', () => {
      const coord1Result = Coordinate.create(35.6762, 139.6503);
      if (coord1Result.isErr()) throw coord1Result.error;
      const coord1 = coord1Result.value;
      const coord2Result = Coordinate.create(35.6896, 139.7006);
      if (coord2Result.isErr()) throw coord2Result.error;
      const coord2 = coord2Result.value;

      expect(coord1.equals(coord2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('正しい文字列形式を返す', () => {
      const coordResult = Coordinate.create(35.6762, 139.6503);
      if (coordResult.isErr()) throw coordResult.error;
      const coord = coordResult.value;
      expect(coord.toString()).toBe('35.6762,139.6503');
    });
  });

  describe('toJSON', () => {
    it('正しいJSON形式を返す', () => {
      const coordResult = Coordinate.create(35.6762, 139.6503);
      if (coordResult.isErr()) throw coordResult.error;
      const coord = coordResult.value;
      const json = coord.toJSON();

      expect(json).toEqual({
        latitude: 35.6762,
        longitude: 139.6503,
      });
    });
  });
});
