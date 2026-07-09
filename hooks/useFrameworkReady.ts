import { useEffect } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export function useFrameworkReady() {
  useEffect(() => {
    (async () => {
      try {
        // Load fonts from expo-google-fonts
        await Font.loadAsync({
          Inter_400Regular: require('@expo-google-fonts/inter')['400'],
          Inter_500Medium: require('@expo-google-fonts/inter')['500'],
          Inter_600SemiBold: require('@expo-google-fonts/inter')['600'],
        });

        // TODO: Initialize audio engine here
        // TODO: Load user preferences
        // TODO: Initialize any other framework components

        // Hide splash screen after everything is loaded
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error('[useFrameworkReady] Initialization error:', e);
        // Still hide splash screen even on error to prevent app from getting stuck
        await SplashScreen.hideAsync();
      }
    })();
  }, []);
}
