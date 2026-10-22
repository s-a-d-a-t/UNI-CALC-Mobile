import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'unicalc_access_token';
const REFRESH_TOKEN_KEY = 'unicalc_refresh_token';
const SESSION_COOKIE_KEY = 'unicalc_session_cookie';

const isWeb = Platform.OS === 'web';

/**
 * Token Storage
 * Uses SecureStore (Android Keystore / iOS Keychain) on Mobile.
 * Uses standard localStorage fallback on Web browsers.
 */
export const TokenStorage = {
  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          if (refreshToken) {
            window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          }
        }
        return;
      }
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error('Failed to securely store tokens:', error);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(ACCESS_TOKEN_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(REFRESH_TOKEN_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(ACCESS_TOKEN_KEY);
          window.localStorage.removeItem(REFRESH_TOKEN_KEY);
          window.localStorage.removeItem(SESSION_COOKIE_KEY);
        }
        return;
      }
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SESSION_COOKIE_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  },

  async saveSessionCookie(cookie: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(SESSION_COOKIE_KEY, cookie);
        }
        return;
      }
      await SecureStore.setItemAsync(SESSION_COOKIE_KEY, cookie);
    } catch (error) {
      console.error('Failed to save session cookie:', error);
    }
  },

  async getSessionCookie(): Promise<string | null> {
    try {
      if (isWeb) {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(SESSION_COOKIE_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(SESSION_COOKIE_KEY);
    } catch (error) {
      return null;
    }
  },
};

/**
 * General Offline Cache Storage (AsyncStorage)
 * Used for storing non-sensitive cached semesters, assignments, and local drafts
 */
export const LocalCache = {
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(`@unicalc_${key}`, jsonValue);
    } catch (error) {
      console.error(`Failed to cache data for key: ${key}`, error);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(`@unicalc_${key}`);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Failed to read cached data for key: ${key}`, error);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@unicalc_${key}`);
    } catch (error) {
      console.error(`Failed to remove cached data for key: ${key}`, error);
    }
  },
};
