import 'react-native-get-random-values'; // <--- POLYFILL ESSENCIAL PARA UUID
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../../../types/chat';
import { chatService } from '../../../services/chatService';
import { attachmentService, AttachmentPickerResult } from '../../../services/attachmentService';
import { setCachedChatData } from '../../../services/chatCacheService';
import { ChatData } from './useChatState';

type UseChatSenderDeps = {
  updateChatData: (chatId: string, updater: (prevData: ChatData) => Partial<ChatData>) => void;
  setIsTypingById: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeSendPromises: React.MutableRefObject<Record<string, Promise<void>>>;
};

export const useChatSender = ({
  updateChatData,
  setIsTypingById,
  activeSendPromises,
}: UseChatSenderDeps) => {

  const sendMessage = useCallback(async (chatId: string, text: string) => {
    if (activeSendPromises.current[chatId] !== undefined) return;

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

    const sendPromise = chatService.sendMessage(chatId, text)
      .then((apiReplies) => {
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

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
      })
      .catch(error => {
        console.error(`[ChatSender] Failed to send message:`, error);
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
        
        const errorMsg: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: 'Falha ao enviar mensagem. Verifique sua conexão e tente novamente.',
            created_at: new Date().toISOString()
        };

        updateChatData(chatId, (prev) => ({
             messages: prev.messages.map(m => m.id === tempUserMsgId ? errorMsg : m)
        }));
      })
      .finally(() => {
        delete activeSendPromises.current[chatId];
      });

    activeSendPromises.current[chatId] = sendPromise;
  }, [updateChatData, setIsTypingById, activeSendPromises]);


  const archiveAndStartNew = useCallback(async (chatId: string): Promise<string | null> => {
    try {
      const { new_chat_id } = await chatService.archiveAndCreateNewChat(chatId);
      updateChatData(chatId, () => ({ messages: [], nextPage: 1 })); 
      return new_chat_id;
    } catch (error) {
      console.error(`[ChatSender] Failed to archive chat:`, error);
      return null;
    }
  }, [updateChatData]);


  const sendMultipleAttachments = useCallback(async (chatId: string, files: AttachmentPickerResult[]) => {
    if (!files.length) return;

    // Usa UUID seguro aqui também
    const tempMessages: ChatMessage[] = files.map(file => ({
      id: uuidv4(),
      role: 'user',
      content: '',
      created_at: new Date().toISOString(),
      attachment_url: file.uri,
      attachment_type: file.type || 'application/octet-stream',
      original_filename: file.name,
    }));

    const tempIds = new Set(tempMessages.map(m => m.id));

    updateChatData(chatId, (prev) => ({
      messages: [...prev.messages, ...tempMessages],
    }));

    try {
      const apiReplies = await attachmentService.uploadBatchAttachments(chatId, files);
      
      if (!Array.isArray(apiReplies)) {
        throw new Error('Resposta inválida do servidor para upload em lote');
      }

      updateChatData(chatId, (prev) => {
        const messagesClean = prev.messages.filter(m => !tempIds.has(m.id));
        
        const existingIds = new Set(messagesClean.map(m => m.id));
        const uniqueReplies = apiReplies.filter(r => !existingIds.has(r.id));

        const finalMessages = [...messagesClean, ...uniqueReplies];

        setCachedChatData(chatId, {
          messages: finalMessages,
          nextPage: prev.nextPage,
          timestamp: Date.now(),
        }).catch(console.error);

        return { messages: finalMessages };
      });

    } catch (error: any) {
      console.error('[ChatSender] Batch upload failed:', error);
      
      updateChatData(chatId, (prev) => ({
        messages: prev.messages.filter(m => !tempIds.has(m.id)),
      }));
      
      throw error;
    }
  }, [updateChatData]);

  const sendAttachment = useCallback(async (chatId: string, file: AttachmentPickerResult) => {
    return sendMultipleAttachments(chatId, [file]);
  }, [sendMultipleAttachments]);

  return {
    sendMessage,
    archiveAndStartNew,
    sendMultipleAttachments,
    sendAttachment,
  };
};