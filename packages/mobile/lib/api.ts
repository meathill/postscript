import { useAuthStore } from '../store/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request Failed');
  }

  return data;
}

export const api = {
  auth: {
    loginWithApple: async (identityToken: string) => {
      return fetchApi<{ token: string; user: any }>('/api/auth/apple', {
        method: 'POST',
        body: JSON.stringify({ identityToken }),
      });
    },
    async getMe() {
      return fetchApi<{ user: any }>('/api/auth/me');
    },
  },
  recipients: {
    async list() {
      return fetchApi<any[]>('/api/recipients');
    },
    async create(data: { name: string; email: string; relationship?: string }) {
      return fetchApi<any>('/api/recipients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async delete(id: string) {
      return fetchApi<{ success: boolean }>(`/api/recipients/${id}`, {
        method: 'DELETE',
      });
    },
  },
};
