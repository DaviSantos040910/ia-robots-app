// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

// Importe suas telas e navegadores
import { MainTabNavigator } from './MainTabNavigator';
import ChatScreen from '../screens/Chat/ChatScreen';
import BotSettingsScreen from '../screens/BotSettings/BotSettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import CreateBotScreen from '../screens/CreateBot/CreateBotScreen';

// Importe o hook de autenticação
import { useAuth } from '../contexts/auth/AuthProvider';

const AppStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<RootStackParamList>();

// --- DEFINIÇÃO RESTAURADA ---
// Este é o navegador para quando o usuário ESTÁ autenticado.
const AppStackNavigator: React.FC = () => (
  <AppStack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="Main" component={MainTabNavigator} />
    <AppStack.Screen name="ChatScreen" component={ChatScreen} />
    <AppStack.Screen name="BotSettings" component={BotSettingsScreen} />
    <AppStack.Screen name="Create" component={CreateBotScreen} />
  </AppStack.Navigator>
);

// --- DEFINIÇÃO RESTAURADA ---
// Este é o navegador para quando o usuário NÃO ESTÁ autenticado.
const AuthStackNavigator: React.FC = () => (
  <AuthStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
  </AuthStack.Navigator>
);

const RootNavigator: React.FC = () => {
  // A lógica para verificar se o usuário está autenticado permanece a mesma
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {/* Agora, o React consegue encontrar os componentes AppStackNavigator e AuthStackNavigator
        porque eles estão definidos neste mesmo arquivo.
      */}
      {isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;