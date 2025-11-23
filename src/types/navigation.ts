// src/types/navigation.ts
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MainTabParamList } from '../navigation/MainTabNavigator';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  // Main contém as abas
  Main: NavigatorScreenParams<MainTabParamList>;
  
  // Telas do Stack Principal (que ficam "acima" das abas)
  ChatScreen: { 
    chatId: string;
    botId: string; 
    botName: string; 
    botHandle: string; 
    botAvatarUrl?: string | null; 
    isArchived?: boolean;
  };
  
  BotSettings: { botId: string };
  
  // Rota para criar bot (fora das abas para ser modal/full screen se quiser)
  Create: undefined;

  // Nova rota para Voice Call
  VoiceCall: {
    chatId: string;
    botId: string;
    botName: string;
    botHandle: string; // Adicionado
    botAvatarUrl?: string | null;
  };

  ArchivedChats: { botId: string }; 
};