// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

// Import screens and navigators
import { MainTabNavigator } from './MainTabNavigator';
import ChatScreen from '../screens/Chat/ChatScreen';
import BotSettingsScreen from '../screens/BotSettings/BotSettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import CreateBotScreen from '../screens/CreateBot/CreateBotScreen';
import ArchivedChatsScreen from '../screens/ArchivedChats/ArchivedChatsScreen'; // New Screen
import { useAuth } from '../contexts/auth/AuthProvider';

const AppStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<RootStackParamList>();

// Navigator for when the user IS authenticated.
const AppStackNavigator: React.FC = () => (
  <AppStack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="Main" component={MainTabNavigator} />
    <AppStack.Screen name="ChatScreen" component={ChatScreen} />
    <AppStack.Screen name="BotSettings" component={BotSettingsScreen} />
    <AppStack.Screen name="Create" component={CreateBotScreen} />
    <AppStack.Screen name="ArchivedChats" component={ArchivedChatsScreen} /> 
  </AppStack.Navigator>
);

// Navigator for when the user IS NOT authenticated.
const AuthStackNavigator: React.FC = () => (
  <AuthStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
  </AuthStack.Navigator>
);

const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;