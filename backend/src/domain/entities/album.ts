import { Result, ok, err } from 'neverthrow';
import { AlbumId, UserId } from '../value-objects/ids.js';
import { Coordinate } from '../value-objects/coordinate.js';
import { ImageUrl } from '../value-objects/image-url.js';

export class AlbumDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlbumDomainError';
  }
}

export interface AlbumProps {
  id: AlbumId;
  coordinate: Coordinate;
  imageUrls: ImageUrl[];
  userId: UserId;
  createdAt: Date;
  updatedAt: Date;
}

export class Album {
  private constructor(private props: AlbumProps) {}

  static create(
    coordinate: Coordinate,
    imageUrls: ImageUrl[],
    userId: UserId,
    id?: AlbumId,
    createdAt?: Date,
    updatedAt?: Date
  ): Result<Album, AlbumDomainError> {
    if (imageUrls.length === 0) {
      return err(new AlbumDomainError('Album must have at least one image'));
    }

    if (imageUrls.length > 10) {
      return err(new AlbumDomainError('Album cannot have more than 10 images'));
    }

    const now = new Date();
    const albumProps: AlbumProps = {
      id: id || AlbumId.generate(),
      coordinate,
      imageUrls,
      userId,
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    };

    return ok(new Album(albumProps));
  }

  static reconstitute(props: AlbumProps): Album {
    return new Album(props);
  }

  get id(): AlbumId {
    return this.props.id;
  }

  get coordinate(): Coordinate {
    return this.props.coordinate;
  }

  get imageUrls(): ImageUrl[] {
    return [...this.props.imageUrls];
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  addImage(imageUrl: ImageUrl): Result<void, AlbumDomainError> {
    if (this.props.imageUrls.length >= 10) {
      return err(new AlbumDomainError('Cannot add more than 10 images to an album'));
    }

    if (this.props.imageUrls.some(url => url.equals(imageUrl))) {
      return err(new AlbumDomainError('Image URL already exists in this album'));
    }

    this.props.imageUrls.push(imageUrl);
    this.props.updatedAt = new Date();
    
    return ok(undefined);
  }

  removeImage(imageUrl: ImageUrl): Result<void, AlbumDomainError> {
    const index = this.props.imageUrls.findIndex(url => url.equals(imageUrl));
    
    if (index === -1) {
      return err(new AlbumDomainError('Image URL not found in this album'));
    }

    if (this.props.imageUrls.length === 1) {
      return err(new AlbumDomainError('Cannot remove the last image from an album'));
    }

    this.props.imageUrls.splice(index, 1);
    this.props.updatedAt = new Date();
    
    return ok(undefined);
  }

  updateCoordinate(coordinate: Coordinate): void {
    this.props.coordinate = coordinate;
    this.props.updatedAt = new Date();
  }

  isOwnedBy(userId: UserId): boolean {
    return this.props.userId.equals(userId);
  }
}