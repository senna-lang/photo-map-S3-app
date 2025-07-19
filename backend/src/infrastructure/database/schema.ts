import { pgTable, uuid, varchar, json, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: varchar('github_id', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const albums = pgTable('albums', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  coordinate: json('coordinate')
    .$type<{ lng: number; lat: number }>()
    .notNull(),
  imageUrls: json('image_urls').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserSchema = typeof users.$inferSelect;
export type AlbumSchema = typeof albums.$inferSelect;
export type InsertUserSchema = typeof users.$inferInsert;
export type InsertAlbumSchema = typeof albums.$inferInsert;