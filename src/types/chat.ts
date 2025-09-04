export type ChatRole = 'user' | 'bot' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO
  status?: 'sending' | 'delivered' | 'failed';
}

export interface ChatBootstrap {
  conversationId: string;
  bot: {
    name: string;
    handle: string;
    avatarUrl: string;
  };
  welcome: string;
  suggestions: string[];
}