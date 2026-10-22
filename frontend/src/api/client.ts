import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { TokenStorage } from '../lib/storage';

/**
 * Normalizes the API URL:
 * - Appends '/api' if missing from EXPO_PUBLIC_API_URL
 * - Automatically falls back to local port 3001 for emulator / local testing
 */
const getNormalizedBaseURL = (): string => {
  let url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    if (Platform.OS === 'android') {
      url = 'http://10.0.2.2:3001/api';
    } else {
      url = 'http://localhost:3001/api';
    }
  }

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
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if present
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await TokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Catch 401s
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token if expired or unauthorized
      await TokenStorage.clearTokens();
    }
    return Promise.reject(error);
  }
);
