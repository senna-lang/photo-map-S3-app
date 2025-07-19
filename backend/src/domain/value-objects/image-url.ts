import { Result, ok, err } from 'neverthrow';

export class InvalidImageUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidImageUrlError';
  }
}

export class ImageUrl {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<ImageUrl, InvalidImageUrlError> {
    if (!value || value.trim().length === 0) {
      return err(new InvalidImageUrlError('Image URL cannot be empty'));
    }

    try {
      new URL(value);
    } catch {
      return err(new InvalidImageUrlError(`Invalid URL format: ${value}`));
    }

    // Validate that it's an image URL (basic check)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      value.toLowerCase().includes(ext)
    );
    
    // Allow S3 URLs even without file extension
    const isS3Url = value.includes('.s3.') || value.includes('amazonaws.com');
    
    if (!hasImageExtension && !isS3Url) {
      return err(new InvalidImageUrlError(`URL does not appear to be an image: ${value}`));
    }

    return ok(new ImageUrl(value));
  }

  get value(): string {
    return this._value;
  }

  equals(other: ImageUrl): boolean {
    return this._value === other._value;
  }
}