// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

// Import your screens
import ChatListScreen from '../screens/ChatList/ChatListScreen'; // Renamed from AllChatsScreen
import ExploreScreen from '../screens/Explore/ExploreScreen';
import BotsScreen from '../screens/Bots/BotsScreen'; // New Screen

// Import the custom BottomNav
import { BottomNav } from '../components/navigation/BottomNav';
import { RootStackParamList } from '../types/navigation';

// These are dummy components that will never be displayed.
const CreatePlaceholderScreen = () => null;
const MeScreen = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Me</Text></View>;

// Define the param list for the tab navigator
export type MainTabParamList = {
  Chat: undefined;
  Explore: undefined;
  Create: undefined;
  Bots: undefined; // Replaced Message with Bots
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
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
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
      <Tab.Screen name="Bots" component={BotsScreen} />
      <Tab.Screen name="Me" component={MeScreen} />
    </Tab.Navigator>
  );
};