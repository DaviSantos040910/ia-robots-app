import { useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import { ChatMessage } from '../../../types/chat';
import { chatService } from '../../../services/chatService';
import { useTTS } from '../../../hooks/useTTS';
import { ChatData } from './useChatState';

// Dependências necessárias para o hook funcionar
type UseChatInteractionsDeps = {
  updateChatData: (chatId: string, updater: (prevData: ChatData) => Partial<ChatData>) => void;
};

export const useChatInteractions = ({ updateChatData }: UseChatInteractionsDeps) => {
  
  // Integração com o hook global de Text-to-Speech
  const {
    playTTS,
    stopTTS,
    isPlaying: isTTSPlaying,
    isLoading: isTTSLoading,
    currentMessageId: currentTTSMessageId,
  } = useTTS();

  /**
   * Copia o conteúdo da mensagem para a área de transferência.
   */
  const handleCopyMessage = useCallback((message: ChatMessage) => {
    if (message.content) {
      Clipboard.setStringAsync(message.content);
    }
  }, []);

  /**
   * Alterna o estado de "like" de uma mensagem.
   * Implementa Optimistic UI para feedback instantâneo.
   */
  const handleLikeMessage = useCallback(async (chatId: string, message: ChatMessage) => {
    // 1. Calcula o novo estado esperado
    const newLikedState = !message.liked;

    // 2. Optimistic Update: Atualiza a UI imediatamente
    updateChatData(chatId, (prev) => ({
      messages: prev.messages.map((m) =>
        m.id === message.id ? { ...m, liked: newLikedState } : m
      ),
    }));

    try {
      // 3. Chama a API
      const result = await chatService.toggleMessageLike(chatId, message.id);
      
      // 4. Confirmação: Se o backend retornar um estado diferente do esperado, corrigimos.
      // Isso garante consistência final.
      if (result.liked !== newLikedState) {
         updateChatData(chatId, (prev) => ({
          messages: prev.messages.map((m) =>
            m.id === message.id ? { ...m, liked: result.liked } : m
          ),
        }));
      }

    } catch (error) {
      console.error('[ChatInteractions] Failed to toggle like:', error);
      
      // 5. Rollback em caso de erro: Reverte para o estado original
      updateChatData(chatId, (prev) => ({
        messages: prev.messages.map((m) =>
          m.id === message.id ? { ...m, liked: !newLikedState } : m
        ),
      }));
    }
  }, [updateChatData]);

  return {
    // TTS Exports
    playTTS,
    stopTTS,
    isTTSPlaying,
    isTTSLoading,
    currentTTSMessageId,
    
    // Action Exports
    handleCopyMessage,
    handleLikeMessage,
  };
};