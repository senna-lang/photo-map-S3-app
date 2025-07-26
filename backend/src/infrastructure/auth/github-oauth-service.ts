/**
 * GitHub OAuth認証サービス
 * GitHubのOAuth認証フローを処理する
 */

import { Result, ok, err } from 'neverthrow';

export interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GitHubUser {
  id: string;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export class GitHubOAuthService {
  private readonly baseUrl = 'https://github.com';
  private readonly apiUrl = 'https://api.github.com';

  constructor(private readonly config: GitHubConfig) {}

  /**
   * GitHub認証URLを生成する
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'read:user user:email',
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.baseUrl}/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * 認証コードをアクセストークンに交換する
   */
  async exchangeCodeForToken(code: string): Promise<Result<string, Error>> {
    try {
      const response = await fetch(`${this.baseUrl}/login/oauth/access_token`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        return err(
          new Error(
            `GitHub API error: ${response.status} ${response.statusText}`
          )
        );
      }

      const data = (await response.json()) as GitHubTokenResponse;

      if (!data.access_token) {
        return err(new Error('No access token received from GitHub'));
      }

      return ok(data.access_token);
    } catch (error) {
      return err(new Error(`Failed to exchange code for token: ${error}`));
    }
  }

  /**
   * アクセストークンを使ってユーザー情報を取得する
   */
  async getUserInfo(accessToken: string): Promise<Result<GitHubUser, Error>> {
    try {
      const response = await fetch(`${this.apiUrl}/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return err(
          new Error(
            `GitHub API error: ${response.status} ${response.statusText}`
          )
        );
      }

      const user = (await response.json()) as GitHubUser;

      // 必須フィールドの検証
      if (!user.id || !user.login) {
        return err(new Error('Invalid user data received from GitHub'));
      }

      return ok(user);
    } catch (error) {
      return err(new Error(`Failed to get user info: ${error}`));
    }
  }

  /**
   * 完全な認証フローを実行する
   */
  async authenticate(code: string): Promise<Result<GitHubUser, Error>> {
    const tokenResult = await this.exchangeCodeForToken(code);
    if (tokenResult.isErr()) {
      return err(tokenResult.error);
    }

    const userResult = await this.getUserInfo(tokenResult.value);
    if (userResult.isErr()) {
      return err(userResult.error);
    }

    return ok(userResult.value);
  }
}
