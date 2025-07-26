/**
 * リポジトリテスト用のヘルパー関数
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schema';
import {
  Coordinate,
  ImageUrl,
  UserId,
  AlbumId,
} from '../../domain/value-objects';
import { Album, User } from '../../domain/entities';

/**
 * テスト用データベース接続
 */
export function createTestDb() {
  // テスト用のインメモリまたは専用テストDB
  const connectionString =
    process.env.TEST_DATABASE_URL ||
    'postgresql://localhost:5432/photo_map_test';
  const sql = postgres(connectionString, { max: 1 });
  return drizzle(sql, { schema });
}

/**
 * テストデータベースをクリア
 */
export async function clearTestDb(db: ReturnType<typeof createTestDb>) {
  await db.delete(schema.albums);
  await db.delete(schema.users);
}

/**
 * テスト用のユーザーエンティティを作成
 */
export function createTestUser(
  overrides: Partial<{
    githubId: string;
    username: string;
    avatarUrl: string;
    name: string;
  }> = {}
): User {
  const userResult = User.create(
    overrides.githubId || '12345',
    overrides.username || 'testuser',
    overrides.avatarUrl || 'https://github.com/testuser.png',
    overrides.name || 'Test User'
  );

  if (userResult.isErr()) {
    throw userResult.error;
  }

  return userResult.value;
}

/**
 * テスト用のアルバムエンティティを作成
 */
export function createTestAlbum(
  userId: UserId,
  overrides: Partial<{
    latitude: number;
    longitude: number;
    imageUrls: string[];
  }> = {}
): Album {
  const coordinateResult = Coordinate.create(
    overrides.latitude || 35.6762,
    overrides.longitude || 139.6503
  );

  if (coordinateResult.isErr()) {
    throw coordinateResult.error;
  }

  const imageUrlStrings = overrides.imageUrls || [
    'https://example.com/image1.jpg',
  ];
  const imageUrlResults = imageUrlStrings.map((url) => ImageUrl.create(url));

  const imageUrls: ImageUrl[] = [];
  for (const result of imageUrlResults) {
    if (result.isErr()) {
      throw result.error;
    }
    imageUrls.push(result.value);
  }

  const albumResult = Album.create(coordinateResult.value, imageUrls, userId);

  if (albumResult.isErr()) {
    throw albumResult.error;
  }

  return albumResult.value;
}

/**
 * テスト用のUserId生成
 */
export function createTestUserId(): UserId {
  return UserId.generate();
}

/**
 * テスト用のAlbumId生成
 */
export function createTestAlbumId(): AlbumId {
  return AlbumId.generate();
}
