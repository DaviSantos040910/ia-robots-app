// src/types/navigation.ts
import type { ChatMessage, ChatBootstrap, ChatListItem } from '../types/chat';
import type { NavigatorScreenParams } from '@react-navigation/native'; // <-- Adicione esta importação
import type { MainTabParamList } from '../navigation/MainTabNavigator';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: NavigatorScreenParams<MainTabParamList>; // Indica que 'Main' aceita params para suas telas internas  
  // Tab Navigator Screens
  Chat: undefined; // Renamed from AllChats
  Explore: undefined;
  Create: undefined;
  Bots: undefined; // New Screen
  Me: undefined;
  
  // Stack Screens
  ChatScreen: { 
    chatId: string;
    botId: string; // --- ADICIONADO: Garante que sabemos qual bot está no chat ---
    botName: string; // Pass bot name for the header
    botHandle: string; // Pass bot handle for the header
    botAvatarUrl?: string | null; 
    isArchived?: boolean;// Pass avatar for the header
  };
  
  BotSettings: { botId: string };

  // New Screen for archived conversations
  ArchivedChats: { botId: string }; 
};