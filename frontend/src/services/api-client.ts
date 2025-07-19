const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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

// Generic API fetch function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
};

// Export API methods
export const api = {
  // Album methods
  albums: {
    getAll: async () => {
      return apiRequest('/api/albums');
    },
    
    create: async (data: { coordinate: { lng: number; lat: number }; imageUrls: string[] }) => {
      return apiRequest('/api/albums', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    delete: async (id: string) => {
      return apiRequest(`/api/albums/${id}`, {
        method: 'DELETE',
      });
    },
  },
  
  // Auth methods
  auth: {
    getGithubUrl: async () => {
      return apiRequest('/api/auth/github');
    },
    
    signIn: async (code: string) => {
      const result = await apiRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ provider: 'github', code }),
      });
      
      setAuthToken(result.accessToken);
      return result;
    },
    
    getCurrentUser: async () => {
      return apiRequest('/api/auth/me');
    },
    
    signOut: async () => {
      const result = await apiRequest('/api/auth/signout', {
        method: 'POST',
      });
      
      setAuthToken(null);
      return result;
    },
  },
};