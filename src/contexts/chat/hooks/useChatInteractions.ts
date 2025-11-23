import { useCallback } from 'react';
import { Alert } from 'react-native'; // Import Alert
import * as Clipboard from 'expo-clipboard';
import { ChatMessage } from '../../../types/chat';
import { chatService } from '../../../services/chatService';
import { useTTS } from '../../../hooks/useTTS';
import { ChatData } from './useChatState';
import { useTranslation } from 'react-i18next'; // Import i18n

// Dependências necessárias para o hook funcionar
type UseChatInteractionsDeps = {
  updateChatData: (chatId: string, updater: (prevData: ChatData) => Partial<ChatData>) => void;
  setIsBotVoiceMode: React.Dispatch<React.SetStateAction<boolean>>; // Injetado
};

export const useChatInteractions = ({ updateChatData, setIsBotVoiceMode }: UseChatInteractionsDeps) => {
  const { t } = useTranslation(); // Hook de tradução
  
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
   */
  const handleLikeMessage = useCallback(async (chatId: string, message: ChatMessage) => {
    const newLikedState = !message.liked;

    updateChatData(chatId, (prev) => ({
      messages: prev.messages.map((m) =>
        m.id === message.id ? { ...m, liked: newLikedState } : m
      ),
    }));

    try {
      const result = await chatService.toggleMessageLike(chatId, message.id);
      if (result.liked !== newLikedState) {
         updateChatData(chatId, (prev) => ({
          messages: prev.messages.map((m) =>
            m.id === message.id ? { ...m, liked: result.liked } : m
          ),
        }));
      }
    } catch (error) {
      console.error('[ChatInteractions] Failed to toggle like:', error);
      updateChatData(chatId, (prev) => ({
        messages: prev.messages.map((m) =>
          m.id === message.id ? { ...m, liked: !newLikedState } : m
        ),
      }));
    }
  }, [updateChatData]);

  /**
   * --- NOVO: Alterna o Modo de Voz do Bot ---
   */
  const toggleBotVoiceMode = useCallback(() => {
    setIsBotVoiceMode((prev) => {
      const newState = !prev;
      
      // Feedback simples usando Alert (pode ser substituído por um Toast customizado)
      // Em produção, um Toast é menos intrusivo.
      /* Alert.alert(
        newState ? t('chat.voiceModeOn') : t('chat.voiceModeOff'),
        newState ? 'O bot lerá as respostas automaticamente.' : 'O bot responderá apenas com texto.'
      );
      */
     
      // Se desativar o modo de voz, parar qualquer fala atual
      if (!newState) {
        stopTTS();
      }

      return newState;
    });
  }, [setIsBotVoiceMode, t, stopTTS]);

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
    toggleBotVoiceMode, // Exporta a nova função
  };
};