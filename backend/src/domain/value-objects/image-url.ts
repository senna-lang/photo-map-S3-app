/**
 * 画像URLを表す値オブジェクト
 * URL形式の検証を含む
 */

import { Result, ok, err } from 'neverthrow';
import { InvalidUrlFormatError } from '../errors';

type Branded<T, B> = T & { _brand: B };
type ImageUrlValue = Branded<string, 'ImageUrl'>;

export class ImageUrl {
  private constructor(private readonly _value: ImageUrlValue) {}

  static create(url: string): Result<ImageUrl, InvalidUrlFormatError> {
    // URL形式の検証
    try {
      const urlObject = new URL(url);
      
      // HTTPSまたはHTTPのみ許可
      if (!['http:', 'https:'].includes(urlObject.protocol)) {
        return err(new InvalidUrlFormatError(url));
      }

      // 画像ファイル拡張子の検証（オプション）
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const pathname = urlObject.pathname.toLowerCase();
      const hasValidExtension = validExtensions.some(ext => pathname.endsWith(ext));
      
      if (!hasValidExtension) {
        return err(new InvalidUrlFormatError(`${url} - must be a valid image file`));
      }

      return ok(new ImageUrl(url as ImageUrlValue));
    } catch {
      return err(new InvalidUrlFormatError(url));
    }
  }

  get value(): string {
    return this._value;
  }

  /**
   * 等価性チェック
   */
  equals(other: ImageUrl): boolean {
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