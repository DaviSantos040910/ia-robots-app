// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Import your screens
import AllChatsScreen from '../screens/AllChats/AllChatsScreen';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import { View, Text } from 'react-native';

// Import the custom BottomNav
import { BottomNav } from '../components/navigation/BottomNav';
import { RootStackParamList } from '../types/navigation';

// This is a dummy component that will never be displayed.
const CreatePlaceholderScreen = () => null;

// Stub components for screens not yet fully implemented
const MessageScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Messages</Text></View>;
const MeScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Me</Text></View>;

// Define the param list for the tab navigator
export type MainTabParamList = {
  Chat: undefined;
  Explore: undefined;
  Create: undefined;
  Message: undefined;
  Me: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Chat" component={AllChatsScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      {/* AJUSTE: A tipagem foi corrigida e a lógica de navegação agora usa `getParent()`
        para acessar o StackNavigator e chamar a tela 'Create' a partir dele.
        Esta é a abordagem mais segura e type-safe.
      */}
      <Tab.Screen
        name="Create"
        component={CreatePlaceholderScreen}
        listeners={({
          navigation,
        }: {
          navigation: BottomTabNavigationProp<MainTabParamList>;
        }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Get the parent StackNavigator and navigate to the 'Create' screen from there.
            navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Create');
          },
        })}
      />
      <Tab.Screen name="Message" component={MessageScreen} />
      <Tab.Screen name="Me" component={MeScreen} />
    </Tab.Navigator>
  );
};