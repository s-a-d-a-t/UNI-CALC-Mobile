import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { TokenStorage } from '../lib/storage';

/**
 * Normalizes the API URL:
 * - Appends '/api' if missing from EXPO_PUBLIC_API_URL
 * - Automatically falls back to local port 3001 for emulator / local testing
 */
const getNormalizedBaseURL = (): string => {
  // In web browser preview (localhost:8081), use relative '/api' so Metro proxies to Render without CORS issues
  if (Platform.OS === 'web') {
    return '/api';
  }

  let url = process.env.EXPO_PUBLIC_API_URL || 'https://uni-calc-backend.onrender.com/api';

  // Ensure /api is appended if user provided base origin
  const cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/api`;
  }
  return cleanUrl;
};

export const API_BASE_URL = getNormalizedBaseURL();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s allows Render free instance to cold-start wake up
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Session Cookie or JWT Bearer Token if present
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Attach Cookie (for Render express-session)
    const cookie = await TokenStorage.getSessionCookie();
    if (cookie && config.headers) {
      config.headers.Cookie = cookie;
    }

    // 2. Attach JWT Bearer Token if available
    const token = await TokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Capture session cookies and catch 401s
apiClient.interceptors.response.use(
  async (response) => {
    // Capture set-cookie header on mobile platforms
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      // Extract connect.sid cookie
      const match = cookieStr.match(/connect\.sid=[^;]+/);
      if (match) {
        await TokenStorage.saveSessionCookie(match[0]);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token if expired or unauthorized
      await TokenStorage.clearTokens();
    }
    return Promise.reject(error);
  }
);
