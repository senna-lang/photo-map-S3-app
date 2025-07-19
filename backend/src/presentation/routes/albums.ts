import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createAlbumSchema, deleteAlbumSchema } from '../../schemas/index.js';
import { GetAllAlbumsUseCase } from '../../application/use-cases/album/get-all-albums-use-case.js';
import { CreateAlbumUseCase } from '../../application/use-cases/album/create-album-use-case.js';
import { DeleteAlbumUseCase } from '../../application/use-cases/album/delete-album-use-case.js';
import { UserId } from '../../domain/value-objects/ids.js';

type Variables = {
  userId?: string;
};

const albums = new Hono<{ Variables: Variables }>();

// GET /albums - Get all albums
albums.get('/', async (c) => {
  try {
    const getAllAlbumsUseCase = c.get('getAllAlbumsUseCase') as GetAllAlbumsUseCase;
    
    const result = await getAllAlbumsUseCase.execute();
    
    if (result.isErr()) {
      return c.json({ error: result.error.message }, 500);
    }

    return c.json(result.value);
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /albums - Create new album (requires authentication)
albums.post(
  '/',
  zValidator('json', createAlbumSchema),
  async (c) => {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const userIdResult = UserId.create(userId);
      if (userIdResult.isErr()) {
        return c.json({ error: 'Invalid user ID' }, 400);
      }

      const createAlbumUseCase = c.get('createAlbumUseCase') as CreateAlbumUseCase;
      const albumData = c.req.valid('json');
      
      const result = await createAlbumUseCase.execute(albumData, userIdResult.value);
      
      if (result.isErr()) {
        return c.json({ error: result.error.message }, 400);
      }

      return c.json(result.value, 201);
    } catch (error) {
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// DELETE /albums/:id - Delete album (requires authentication and ownership)
albums.delete(
  '/:id',
  zValidator('param', deleteAlbumSchema),
  async (c) => {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const userIdResult = UserId.create(userId);
      if (userIdResult.isErr()) {
        return c.json({ error: 'Invalid user ID' }, 400);
      }

      const deleteAlbumUseCase = c.get('deleteAlbumUseCase') as DeleteAlbumUseCase;
      const { id } = c.req.valid('param');
      
      const result = await deleteAlbumUseCase.execute(id, userIdResult.value);
      
      if (result.isErr()) {
        const statusCode = result.error.message.includes('not found') ? 404 
                         : result.error.message.includes('does not own') ? 403 
                         : 400;
        return c.json({ error: result.error.message }, statusCode);
      }

      return c.json({ message: 'Album deleted successfully' }, 200);
    } catch (error) {
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

export { albums };
export type AlbumsApp = typeof albums;