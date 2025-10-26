// src/types/chat.ts

// Represents a single message in a conversation.
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string; // Add timestamp
  // Optional fields that might be used on the frontend
  liked?: boolean;
  rewriting?: boolean;
  audioUri?: string | null;
  suggestions?: string[];
};

// Represents the bot's details.
export type Bot = {
  id: string;
  name: string;
  description: string;
  avatar_url?: string | null;
  is_official?: boolean;
};

// Represents an item in the main chat list screen.
export type ChatListItem = {
  id: string; // This is the Chat ID
  bot: Bot;
  last_message: ChatMessage | null;
  last_message_at: string;
  status: 'active' | 'archived';
};

// Represents the initial data needed when opening a chat screen.
export type ChatBootstrap = {
  conversationId: string;
  bot: { name: string; handle: string; avatarUrl?: string };
  welcome: string;
  suggestions: string[];
};

// Represents the paginated response for messages from the backend.
export type PaginatedMessages = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatMessage[];
};

export interface ChatCacheData {
  messages: ChatMessage[];
  nextPage: number | null;
  timestamp: number; // Unix timestamp (ms) de quando o cache foi salvo
}