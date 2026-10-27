import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider as AppThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { TokenStorage } from '@/src/lib/storage';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'landing',
};

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  // Fallback timeout to ensure splash screen unlocks
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppThemeProvider>
      <RootLayoutNav />
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    async function checkAuthSession() {
      try {
        const cookie = await TokenStorage.getSessionCookie();
        const token = await TokenStorage.getAccessToken();
        // If neither session cookie nor JWT token exists, show landing page
        if (!cookie && !token) {
          router.replace('/landing');
        }
      } catch (e) {
        router.replace('/landing');
      }
    }
    checkAuthSession();
  }, []);

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="landing" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
