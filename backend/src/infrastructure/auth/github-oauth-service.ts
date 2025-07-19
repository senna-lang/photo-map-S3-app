import { Result, ok, err } from 'neverthrow';

export interface GitHubUserProfile {
  id: string;
  login: string;
  name?: string;
  avatar_url?: string;
  email?: string;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export class GitHubOAuthError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'GitHubOAuthError';
  }
}

export class GitHubOAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID || '';
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
    this.redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/callback';

    if (!this.clientId || !this.clientSecret) {
      throw new Error('GitHub OAuth credentials are required');
    }
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'user:email',
      response_type: 'code',
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<Result<string, GitHubOAuthError>> {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        return err(new GitHubOAuthError(`GitHub token exchange failed: ${response.statusText}`));
      }

      const data: GitHubTokenResponse = await response.json();
      
      if (!data.access_token) {
        return err(new GitHubOAuthError('No access token received from GitHub'));
      }

      return ok(data.access_token);
    } catch (error) {
      return err(new GitHubOAuthError(
        'Failed to exchange code for token',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  async getUserProfile(accessToken: string): Promise<Result<GitHubUserProfile, GitHubOAuthError>> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return err(new GitHubOAuthError(`GitHub API request failed: ${response.statusText}`));
      }

      const profile: GitHubUserProfile = await response.json();
      
      if (!profile.id || !profile.login) {
        return err(new GitHubOAuthError('Invalid user profile received from GitHub'));
      }

      return ok(profile);
    } catch (error) {
      return err(new GitHubOAuthError(
        'Failed to fetch user profile',
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  async authenticateWithCode(code: string): Promise<Result<GitHubUserProfile, GitHubOAuthError>> {
    const tokenResult = await this.exchangeCodeForToken(code);
    if (tokenResult.isErr()) {
      return err(tokenResult.error);
    }

    return await this.getUserProfile(tokenResult.value);
  }
}