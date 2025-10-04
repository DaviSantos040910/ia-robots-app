// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

// Import the new MainTabNavigator
import { MainTabNavigator } from './MainTabNavigator';

// Screens
import ChatScreen from '../screens/Chat/ChatScreen';
import BotSettingsScreen from '../screens/BotSettings/BotSettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
// AJUSTE: Importada a CreateBotScreen para ser usada no StackNavigator.
import CreateBotScreen from '../screens/CreateBot/CreateBotScreen';

const AppStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<RootStackParamList>();

const AppStackNavigator: React.FC = () => (
  // The main stack now contains the entire Tab Navigator as a single screen.
  // Other screens like ChatScreen are pushed on top of the tabs.
  <AppStack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="Main" component={MainTabNavigator} />
    <AppStack.Screen name="ChatScreen" component={ChatScreen} />
    <AppStack.Screen name="BotSettings" component={BotSettingsScreen} />
    {/* AJUSTE: CreateBotScreen agora é uma tela do StackNavigator principal. */}
    <AppStack.Screen name="Create" component={CreateBotScreen} />
  </AppStack.Navigator>
);

const AuthStackNavigator: React.FC = () => (
  <AuthStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
  </AuthStack.Navigator>
);

const RootNavigator: React.FC = () => {
  // TODO: Replace with your real auth selector
  const [isAuthenticated] = React.useState<boolean>(true);

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;