/**
 * データベーススキーマ定義
 * Drizzle ORMを使用したPostgreSQLスキーマ
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  json,
  index,
} from 'drizzle-orm/pg-core';

/**
 * ユーザーテーブル
 * GitHubアカウントと連携したユーザー情報を格納
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    githubId: varchar('github_id', { length: 255 }).unique().notNull(),
    username: varchar('username', { length: 39 }).notNull(), // GitHubの最大ユーザー名長
    avatarUrl: varchar('avatar_url', { length: 500 }),
    name: varchar('name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // インデックス定義
    githubIdIdx: index('users_github_id_idx').on(table.githubId),
    usernameIdx: index('users_username_idx').on(table.username),
  })
);

/**
 * アルバムテーブル
 * 地理座標に関連付けられた写真集合を格納
 */
export const albums = pgTable(
  'albums',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    coordinate: json('coordinate')
      .$type<{ latitude: number; longitude: number }>()
      .notNull(),
    imageUrls: json('image_urls').$type<string[]>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // インデックス定義
    userIdIdx: index('albums_user_id_idx').on(table.userId),
    createdAtIdx: index('albums_created_at_idx').on(table.createdAt),
  })
);

// テーブル型の推論
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;
