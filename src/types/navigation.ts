// src/types/navigation.ts
import type { ChatMessage, ChatBootstrap } from '../types/chat';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
  ForgotPassword: undefined;
  AllChats: undefined;
  
  Explore: undefined;
  Create: undefined;
  History: undefined;
  Me: undefined;
  
  // The `bootstrap` prop is removed, as this data will now be fetched inside the screen.
  // We only need the `chatId` to know which chat to load.
  ChatScreen: { chatId: string; initialMessages?: ChatMessage[] };
  
  BotSettings: { botId: string };
};