import { z } from 'zod';

// Coordinate schema
export const coordinateSchema = z.object({
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
});

// Album schemas
export const createAlbumSchema = z.object({
  coordinate: coordinateSchema,
  imageUrls: z.array(z.string().url()).min(1).max(10),
});

export const deleteAlbumSchema = z.object({
  id: z.string().uuid(),
});

export const albumResponseSchema = z.object({
  id: z.string().uuid(),
  coordinate: coordinateSchema,
  imageUrls: z.array(z.string().url()),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Auth schemas
export const signInSchema = z.object({
  provider: z.literal('github'),
  code: z.string(),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  githubId: z.string(),
  username: z.string(),
  avatarUrl: z.string().url().optional(),
  name: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const authResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

// Export types
export type Coordinate = z.infer<typeof coordinateSchema>;
export type CreateAlbumRequest = z.infer<typeof createAlbumSchema>;
export type Album = z.infer<typeof albumResponseSchema>;
export type DeleteAlbumRequest = z.infer<typeof deleteAlbumSchema>;
export type SignInRequest = z.infer<typeof signInSchema>;
export type User = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;