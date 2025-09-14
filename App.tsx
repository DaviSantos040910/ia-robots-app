
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import './src/i18n/config';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ChatScreen from './src/screens/Chat/ChatScreen';
import { ChatMessage, ChatBootstrap } from './src/types/chat';
import { ChatProvider } from './src/contexts/chat/ChatProvider';
import BotSettingsScreen from '@/screens/BotSettings/BotSettingsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './src/types/navigation';


const Stack = createNativeStackNavigator<RootStackParamList>();

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

  // Example data for ChatScreen (all serializable)
  const bootstrapExample: ChatBootstrap = {
    conversationId: '123',
    bot: { name: 'Robo', handle: 'robo', avatarUrl: '' },
    welcome: 'Olá! Como posso ajudar?',
    suggestions: ['Oi', 'Como você está?', 'Me conte uma piada'],
  };

  const messagesExample: ChatMessage[] = [];

  return (
    <NavigationContainer>
      <ChatProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen
              name="ChatScreen"
              component={ChatScreen}
              initialParams={{
                chatId: 'chat-123',
                bootstrap: bootstrapExample,
                initialMessages: messagesExample,
              }}
            />
            <Stack.Screen name="BotSettings" component={BotSettingsScreen} />
           

          </Stack.Navigator>
          <StatusBar style="auto" />
        </View>
      </ChatProvider>
    </NavigationContainer>
  );
}
