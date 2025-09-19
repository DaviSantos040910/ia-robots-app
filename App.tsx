import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';

import './src/i18n/config';
import RootNavigator from './src/navigation/RootNavigator';
import { ChatProvider } from './src/contexts/chat/ChatProvider';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ChatProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <RootNavigator />
        <StatusBar style="auto" />
      </View>
    </ChatProvider>
  );
}
