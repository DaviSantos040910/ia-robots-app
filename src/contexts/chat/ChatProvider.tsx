
import React, { createContext, useContext, useMemo, useState } from 'react';
import { ChatMessage } from '../../types/chat';
import { chatService } from '../../services/chatService';

export type ChatStore = {
  messagesById: Record<string, ChatMessage[]>;
  isTypingById: Record<string, boolean>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  appendMessage: (chatId: string, msg: ChatMessage) => void;
  updateMessageContent: (chatId: string, messageId: string, newContent: string) => void;
  toggleLike: (chatId: string, messageId: string) => void;
  rewriteMessage: (chatId: string, messageId: string) => Promise<void>;
  speakMessage: (chatId: string, messageId: string) => Promise<void>;
  setTyping: (chatId: string, v: boolean) => void;
};

const ChatContext = createContext<ChatStore | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messagesById, setMessagesById] = useState<Record<string, ChatMessage[]>>({});
  const [isTypingById, setIsTypingById] = useState<Record<string, boolean>>({});

  const appendMessage = (chatId: string, msg: ChatMessage) => {
    setMessagesById(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), msg] }));
  };

  const updateMessageContent = (chatId: string, messageId: string, newContent: string) => {
    setMessagesById(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(m => (m.id === messageId ? { ...m, content: newContent, rewriting: false } : m)),
    }));
  };

  const toggleLike = (chatId: string, messageId: string) => {
    setMessagesById(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(m => (m.id === messageId ? { ...m, liked: !m.liked } : m)),
    }));
  };

  const setTyping = (chatId: string, v: boolean) => setIsTypingById(prev => ({ ...prev, [chatId]: v }));

  const sendMessage = async (chatId: string, text: string) => {
    const userMsg: ChatMessage = { id: String(Date.now()), role: 'user', content: text };
    appendMessage(chatId, userMsg);
    setTyping(chatId, true);
    try {
      const reply = await chatService.sendMessage(chatId, text);
      appendMessage(chatId, reply);
    } finally {
      setTyping(chatId, false);
    }
  };

  const rewriteMessage = async (chatId: string, messageId: string) => {
    // marca como reescrevendo
    setMessagesById(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(m => (m.id === messageId ? { ...m, rewriting: true } : m)),
    }));
    const current = messagesById[chatId]?.find(m => m.id === messageId);
    if (!current) return;
    const newText = await chatService.rewriteMessage(chatId, messageId, current.content);
    updateMessageContent(chatId, messageId, newText);
  };

  const speakMessage = async (chatId: string, messageId: string) => {
    const current = messagesById[chatId]?.find(m => m.id === messageId);
    if (!current) return;
    const uri = await chatService.synthesizeSpeech(chatId, messageId, current.content);
    // Apenas salva a URI (player será implementado na integração real)
    setMessagesById(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map(m => (m.id === messageId ? { ...m, audioUri: uri } : m)),
    }));
  };

  const value = useMemo(
    () => ({ messagesById, isTypingById, sendMessage, appendMessage, updateMessageContent, toggleLike, rewriteMessage, speakMessage, setTyping }),
    [messagesById, isTypingById]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatController = (chatId: string) => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatController must be used within ChatProvider');
  const messages = ctx.messagesById[chatId] || [];
  const isTyping = !!ctx.isTypingById[chatId];
  return {
    messages,
    isTyping,
    sendMessage: (text: string) => ctx.sendMessage(chatId, text),
    appendMessage: (msg: ChatMessage) => ctx.appendMessage(chatId, msg),
    updateMessageContent: (messageId: string, text: string) => ctx.updateMessageContent(chatId, messageId, text),
    toggleLike: (messageId: string) => ctx.toggleLike(chatId, messageId),
    rewriteMessage: (messageId: string) => ctx.rewriteMessage(chatId, messageId),
    speakMessage: (messageId: string) => ctx.speakMessage(chatId, messageId),
    setTyping: (v: boolean) => ctx.setTyping(chatId, v),
  };
};
