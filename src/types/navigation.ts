 
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
ChatScreen: { chatId: string; bootstrap: ChatBootstrap; initialMessages?: ChatMessage[] };
 BotSettings: { botId: string };
  };