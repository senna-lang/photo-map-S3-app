import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/presentation/app';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Create type-safe Hono client
const client = hc<AppType>(API_BASE_URL);

// Auth token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
};

// Create authenticated client
const createAuthenticatedClient = () => {
  const token = getAuthToken();
  
  return hc<AppType>(API_BASE_URL, {
    headers: token ? {
      'Authorization': `Bearer ${token}`,
    } : {},
  });
};

// Export API methods
export const api = {
  // Album methods
  albums: {
    getAll: async () => {
      const response = await client.api.albums.$get();
      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }
      return await response.json();
    },
    
    create: async (data: { coordinate: { lng: number; lat: number }; imageUrls: string[] }) => {
      const authClient = createAuthenticatedClient();
      const response = await authClient.api.albums.$post({
        json: data,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create album');
      }
      
      return await response.json();
    },
    
    delete: async (id: string) => {
      const authClient = createAuthenticatedClient();
      const response = await authClient.api.albums[':id'].$delete({
        param: { id },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete album');
      }
      
      return await response.json();
    },
  },
  
  // Auth methods
  auth: {
    getGithubUrl: async () => {
      const response = await client.api.auth.github.$get();
      if (!response.ok) {
        throw new Error('Failed to get GitHub auth URL');
      }
      return await response.json();
    },
    
    signIn: async (code: string) => {
      const response = await client.api.auth.signin.$post({
        json: { provider: 'github', code },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Authentication failed');
      }
      
      const result = await response.json();
      setAuthToken(result.accessToken);
      return result;
    },
    
    getCurrentUser: async () => {
      const authClient = createAuthenticatedClient();
      const response = await authClient.api.auth.me.$get();
      
      if (!response.ok) {
        if (response.status === 401) {
          setAuthToken(null);
          throw new Error('Authentication required');
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to get current user');
      }
      
      return await response.json();
    },
    
    signOut: async () => {
      const authClient = createAuthenticatedClient();
      const response = await authClient.api.auth.signout.$post();
      
      setAuthToken(null);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sign out');
      }
      
      return await response.json();
    },
  },
};