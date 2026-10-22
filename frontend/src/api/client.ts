import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { TokenStorage } from '../lib/storage';

/**
 * Android Emulator loops back to host machine via 10.0.2.2.
 * iOS Simulator and Web use localhost.
 * Physical devices should point to host computer's LAN IP (e.g. 192.168.x.x).
 */
const getDefaultBaseURL = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api';
  }
  return 'http://localhost:3001/api';
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultBaseURL();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
