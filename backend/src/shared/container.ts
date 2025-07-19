import { db } from '../infrastructure/database/connection.js';
import { DrizzleAlbumRepository } from '../infrastructure/repositories/drizzle-album-repository.js';
import { DrizzleUserRepository } from '../infrastructure/repositories/drizzle-user-repository.js';
import { JwtService } from '../infrastructure/auth/jwt-service.js';
import { GitHubOAuthService } from '../infrastructure/auth/github-oauth-service.js';
import { GetAllAlbumsUseCase } from '../application/use-cases/album/get-all-albums-use-case.js';
import { CreateAlbumUseCase } from '../application/use-cases/album/create-album-use-case.js';
import { DeleteAlbumUseCase } from '../application/use-cases/album/delete-album-use-case.js';
import { SignInUseCase } from '../application/use-cases/auth/sign-in-use-case.js';
import { GetCurrentUserUseCase } from '../application/use-cases/auth/get-current-user-use-case.js';

export class Container {
  private static instance: Container;
  
  // Infrastructure
  private _albumRepository: DrizzleAlbumRepository;
  private _userRepository: DrizzleUserRepository;
  private _jwtService: JwtService;
  private _githubOAuthService: GitHubOAuthService;
  
  // Use Cases
  private _getAllAlbumsUseCase: GetAllAlbumsUseCase;
  private _createAlbumUseCase: CreateAlbumUseCase;
  private _deleteAlbumUseCase: DeleteAlbumUseCase;
  private _signInUseCase: SignInUseCase;
  private _getCurrentUserUseCase: GetCurrentUserUseCase;

  private constructor() {
    // Initialize infrastructure layer
    this._albumRepository = new DrizzleAlbumRepository(db);
    this._userRepository = new DrizzleUserRepository(db);
    this._jwtService = new JwtService();
    this._githubOAuthService = new GitHubOAuthService();
    
    // Initialize use cases with dependencies
    this._getAllAlbumsUseCase = new GetAllAlbumsUseCase(this._albumRepository);
    this._createAlbumUseCase = new CreateAlbumUseCase(this._albumRepository);
    this._deleteAlbumUseCase = new DeleteAlbumUseCase(this._albumRepository);
    this._signInUseCase = new SignInUseCase(
      this._userRepository,
      this._githubOAuthService,
      this._jwtService
    );
    this._getCurrentUserUseCase = new GetCurrentUserUseCase(this._userRepository);
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  // Infrastructure getters
  get albumRepository() {
    return this._albumRepository;
  }

  get userRepository() {
    return this._userRepository;
  }

  get jwtService() {
    return this._jwtService;
  }

  get githubOAuthService() {
    return this._githubOAuthService;
  }

  // Use case getters
  get getAllAlbumsUseCase() {
    return this._getAllAlbumsUseCase;
  }

  get createAlbumUseCase() {
    return this._createAlbumUseCase;
  }

  get deleteAlbumUseCase() {
    return this._deleteAlbumUseCase;
  }

  get signInUseCase() {
    return this._signInUseCase;
  }

  get getCurrentUserUseCase() {
    return this._getCurrentUserUseCase;
  }
}