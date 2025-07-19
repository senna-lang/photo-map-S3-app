import { Context, Next } from 'hono';
import { Container } from '../../shared/container.js';

export function injectDependencies() {
  return async (c: Context, next: Next) => {
    const container = Container.getInstance();
    
    // Inject infrastructure services
    c.set('jwtService', container.jwtService);
    c.set('githubOAuthService', container.githubOAuthService);
    c.set('albumRepository', container.albumRepository);
    c.set('userRepository', container.userRepository);
    
    // Inject use cases
    c.set('getAllAlbumsUseCase', container.getAllAlbumsUseCase);
    c.set('createAlbumUseCase', container.createAlbumUseCase);
    c.set('deleteAlbumUseCase', container.deleteAlbumUseCase);
    c.set('signInUseCase', container.signInUseCase);
    c.set('getCurrentUserUseCase', container.getCurrentUserUseCase);
    
    await next();
  };
}