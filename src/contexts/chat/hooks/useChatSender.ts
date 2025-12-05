import 'react-native-get-random-values';
import { useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../../../types/chat';
import { chatService } from '../../../services/chatService';
import { attachmentService, AttachmentPickerResult } from '../../../services/attachmentService';
import { setCachedChatData } from '../../../services/chatCacheService';
import { ChatData } from './useChatState';

type UseChatSenderDeps = {
  updateChatData: (chatId: string, updater: (prevData: ChatData) => Partial<ChatData>) => void;
  setIsTypingById: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  // CORREÇÃO: Tipagem atualizada para aceitar undefined, alinhado com useChatState
  activeSendPromises: React.MutableRefObject<Record<string, Promise<void> | undefined>>;
  isBotVoiceMode: boolean;
};

export const useChatSender = ({
  updateChatData,
  setIsTypingById,
  activeSendPromises,
  isBotVoiceMode,
}: UseChatSenderDeps) => {

  const voiceModeRef = useRef(isBotVoiceMode);

  useEffect(() => {
    voiceModeRef.current = isBotVoiceMode;
  }, [isBotVoiceMode]);

  /**
   * Helper Interno: Processa o envio de texto (UI Otimista + API).
   * Separado para ser reutilizado pelo sendMessage e sendCombinedMessage.
   */
  const processTextMessage = useCallback(async (chatId: string, text: string) => {
    const tempUserMsgId = uuidv4();
    
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    updateChatData(chatId, (prev) => ({
      messages: [...prev.messages, tempUserMsg],
    }));

    setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

    const shouldReplyWithAudio = voiceModeRef.current;

    try {
      const apiReplies = await chatService.sendMessage(chatId, text, shouldReplyWithAudio);
      
      updateChatData(chatId, (prev) => {
        const messagesWithoutTemp = prev.messages.filter(m => m.id !== tempUserMsgId);
        const existingIds = new Set(messagesWithoutTemp.map(m => m.id));
        const uniqueReplies = apiReplies.filter(r => !existingIds.has(r.id));
        const newFinalMessages = [...messagesWithoutTemp, ...uniqueReplies];

        setCachedChatData(chatId, {
          messages: newFinalMessages,
          nextPage: prev.nextPage,
          timestamp: Date.now(),
        }).catch(err => console.error('[ChatSender] Cache update failed:', err));

        return { messages: newFinalMessages };
      });
    } catch (error) {
      console.error(`[ChatSender] Failed to send message:`, error);
      
      const errorMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: 'Falha ao enviar mensagem. Verifique sua conexão e tente novamente.',
          created_at: new Date().toISOString()
      };

      updateChatData(chatId, (prev) => ({
           messages: prev.messages.map(m => m.id === tempUserMsgId ? errorMsg : m)
      }));
      throw error;
    } finally {
      setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
    }
  }, [updateChatData, setIsTypingById]);

  // --- Função Pública: Enviar Texto ---
  const sendMessage = useCallback(async (chatId: string, text: string) => {
    if (activeSendPromises.current[chatId]) return;

    const promise = processTextMessage(chatId, text)
      .catch(() => {})
      .finally(() => {
        delete activeSendPromises.current[chatId];
      });

    activeSendPromises.current[chatId] = promise;
    return promise;
  }, [processTextMessage, activeSendPromises]);

  // --- Função Pública: Enviar Áudio ---
  const sendVoiceMessage = useCallback(async (chatId: string, audioUri: string, durationMs: number, replyWithAudio: boolean) => {
    if (!audioUri) return;
    const tempId = uuidv4();
    
    const tempMessage: ChatMessage = {
      id: tempId, 
      role: 'user', 
      content: '', 
      created_at: new Date().toISOString(),
      attachment_type: 'audio', 
      attachment_url: audioUri,
      duration: durationMs 
    };

    updateChatData(chatId, (prev) => ({ messages: [...prev.messages, tempMessage] }));
    setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

    try {
      const apiMessages = await chatService.sendVoiceMessage(chatId, audioUri, durationMs, replyWithAudio);
      
      updateChatData(chatId, (prev) => {
        const messagesWithoutTemp = prev.messages.filter(m => m.id !== tempId);
        const existingIds = new Set(messagesWithoutTemp.map(m => m.id));
        const uniqueNewMessages = apiMessages.filter(r => !existingIds.has(r.id));
        const finalMessages = [...messagesWithoutTemp, ...uniqueNewMessages];
        setCachedChatData(chatId, { messages: finalMessages, nextPage: prev.nextPage, timestamp: Date.now() }).catch(console.error);
        return { messages: finalMessages };
      });
    } catch (error) {
      console.error('[ChatSender] Voice message failed:', error);
      const errorMsg: ChatMessage = {
        id: uuidv4(), role: 'assistant', content: 'Falha ao enviar áudio.', created_at: new Date().toISOString()
      };
      updateChatData(chatId, (prev) => ({ messages: prev.messages.map(m => m.id === tempId ? errorMsg : m) }));
    } finally {
      setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
    }
  }, [updateChatData, setIsTypingById]);

  // --- Função Pública: Arquivar ---
  const archiveAndStartNew = useCallback(async (chatId: string): Promise<string | null> => {
    try {
      const { new_chat_id } = await chatService.archiveAndCreateNewChat(chatId);
      updateChatData(chatId, () => ({ messages: [], nextPage: 1 })); 
      return new_chat_id;
    } catch (error) { return null; }
  }, [updateChatData]);

  // --- Função Pública: Enviar Anexos ---
  const sendMultipleAttachments = useCallback(async (chatId: string, files: AttachmentPickerResult[]) => {
    if (!files.length) return;
    const tempMessages: ChatMessage[] = files.map(file => ({
      id: uuidv4(), role: 'user', content: '', created_at: new Date().toISOString(),
      attachment_url: file.uri, attachment_type: file.type || 'application/octet-stream', original_filename: file.name,
    }));
    const tempIds = new Set(tempMessages.map(m => m.id));
    updateChatData(chatId, (prev) => ({ messages: [...prev.messages, ...tempMessages] }));

    try {
      const apiReplies = await attachmentService.uploadBatchAttachments(chatId, files);
      updateChatData(chatId, (prev) => {
        const messagesClean = prev.messages.filter(m => !tempIds.has(m.id));
        const existingIds = new Set(messagesClean.map(m => m.id));
        const uniqueReplies = apiReplies.filter(r => !existingIds.has(r.id));
        const finalMessages = [...messagesClean, ...uniqueReplies];
        setCachedChatData(chatId, { messages: finalMessages, nextPage: prev.nextPage, timestamp: Date.now() }).catch(console.error);
        return { messages: finalMessages };
      });
    } catch (error) {
      console.error('[ChatSender] Batch upload failed:', error);
      updateChatData(chatId, (prev) => ({ messages: prev.messages.filter(m => !tempIds.has(m.id)) }));
      throw error;
    }
  }, [updateChatData]);

  // --- NOVA FUNÇÃO: Envio Combinado (Sequencial) ---
  const sendCombinedMessage = useCallback(async (chatId: string, text: string, attachments: AttachmentPickerResult[]) => {
    // Agora o TS sabe que pode ser undefined, então esta verificação é válida
    if (activeSendPromises.current[chatId]) return;

    const flowPromise = (async () => {
      try {
        if (attachments.length > 0) {
          await sendMultipleAttachments(chatId, attachments);
        }

        if (text.trim().length > 0) {
          await processTextMessage(chatId, text);
        }
      } catch (error) {
        console.error('[ChatSender] Erro no envio combinado:', error);
        throw error;
      } finally {
        delete activeSendPromises.current[chatId];
      }
    })();

    activeSendPromises.current[chatId] = flowPromise;
    return flowPromise;
  }, [activeSendPromises, sendMultipleAttachments, processTextMessage]);

  const sendAttachment = useCallback(async (chatId: string, file: AttachmentPickerResult) => {
    return sendMultipleAttachments(chatId, [file]);
  }, [sendMultipleAttachments]);

  return { 
    sendMessage, 
    sendVoiceMessage, 
    archiveAndStartNew, 
    sendMultipleAttachments, 
    sendAttachment,
    sendCombinedMessage
  };
};