// src/navigation/RootNavigator.tsx
// App/Auth split navigator. Comments in English as requested.
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

// Screens (adjust paths to your project if needed)
import AllChatsScreen from '../screens/AllChats/AllChatsScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
// NOTE: if your file is under screens/Bot/BotSettingsScreen, adjust the import below
import BotSettingsScreen from '../screens/BotSettings/BotSettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';

// Temporary stubs (replace with real screens later)
import { View, Text } from 'react-native';
const Stub: React.FC<{ title: string }> = ({ title }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>{title}</Text>
  </View>
);
const ExploreScreen = () => <Stub title="Explore" />;
const CreateScreen  = () => <Stub title="Create" />;
const HistoryScreen = () => <Stub title="History" />;
const MeScreen      = () => <Stub title="Me" />;

// Split into two stacks to cleanly separate Auth vs App flows
const AppStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<RootStackParamList>();

const AppStackNavigator: React.FC = () => (
  <AppStack.Navigator initialRouteName="AllChats" screenOptions={{ headerShown: false }}>
    {/* App routes */}
    <AppStack.Screen name="AllChats" component={AllChatsScreen} />
    <AppStack.Screen name="ChatScreen" component={ChatScreen} />
    <AppStack.Screen name="BotSettings" component={BotSettingsScreen} />

    {/* Extra routes (placeholders). Replace with your real screens when ready. */}
    <AppStack.Screen name="Explore" component={ExploreScreen} />
    <AppStack.Screen name="Create" component={CreateScreen} />
    <AppStack.Screen name="History" component={HistoryScreen} />
    <AppStack.Screen name="Me" component={MeScreen} />
  </AppStack.Navigator>
);

const AuthStackNavigator: React.FC = () => (
  <AuthStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
  </AuthStack.Navigator>
);

const RootNavigator: React.FC = () => {
  // TODO: Replace with your real auth selector (e.g., from context or redux)
  const [isAuthenticated] = React.useState<boolean>(true);

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
