import axios from 'axios';

/** Relative URLs are proxied to NestJS via next.config rewrites; override with NEXT_PUBLIC_API_URL in production. */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '',
});

// Attach the JWT to every outgoing request automatically
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend says "401 Unauthorized" or "404" on auth, the token is invalid — kick back to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      const status = error.response?.status;
      const url = error.config?.url ?? '';
      const isAuthMe = url.includes('/auth/me');

      if (status === 401 || (status === 404 && isAuthMe)) {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0';
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);