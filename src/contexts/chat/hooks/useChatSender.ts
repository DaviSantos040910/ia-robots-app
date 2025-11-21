import { useCallback } from 'react';
import { ChatMessage } from '../../../types/chat';
import { chatService } from '../../../services/chatService';
import { attachmentService, AttachmentPickerResult } from '../../../services/attachmentService';
import { setCachedChatData } from '../../../services/chatCacheService';
import { ChatData } from './useChatState';

// Dependências necessárias para o hook funcionar
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

  /**
   * Envia uma mensagem de texto simples.
   * Implementa Optimistic UI para feedback instantâneo.
   */
  const sendMessage = useCallback(async (chatId: string, text: string) => {
    // Evita envios duplicados se já existir uma promessa ativa para este chat
    if (activeSendPromises.current[chatId] !== undefined) return;

    // 1. Optimistic UI: Cria mensagem temporária
    const tempUserMsgId = `temp_user_${Date.now()}_${Math.random()}`;
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    // Atualiza UI imediatamente com a mensagem temporária
    updateChatData(chatId, (prev) => ({
      messages: [...prev.messages, tempUserMsg],
    }));

    setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

    // 2. Envio para a API
    const sendPromise = chatService.sendMessage(chatId, text)
      .then((apiReplies) => {
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

        updateChatData(chatId, (prev) => {
          // Remove a mensagem temporária
          const messagesWithoutTemp = prev.messages.filter(m => m.id !== tempUserMsgId);
          
          // Ensure no duplicates from API replies
          const existingIds = new Set(messagesWithoutTemp.map(m => m.id));
          const uniqueReplies = apiReplies.filter(r => !existingIds.has(r.id));

          // Adiciona as mensagens reais retornadas pela API (usuário confirmada + resposta do bot)
          const newFinalMessages = [...messagesWithoutTemp, ...uniqueReplies];

          // Atualiza o cache persistente
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
        
        // Tratamento de Erro Visual:
        // Substitui a mensagem temporária por uma mensagem de erro visível na lista
        // Em uma implementação mais avançada, adicionaríamos um status 'error' à mensagem temporária para permitir retry.
        const errorMsg: ChatMessage = {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: 'Falha ao enviar mensagem. Verifique sua conexão e tente novamente.', // Mensagem amigável
            created_at: new Date().toISOString()
        };

        updateChatData(chatId, (prev) => ({
             messages: prev.messages.map(m => m.id === tempUserMsgId ? errorMsg : m)
        }));
      })
      .finally(() => {
        // Limpa a promessa ativa para permitir novos envios
        delete activeSendPromises.current[chatId];
      });

    activeSendPromises.current[chatId] = sendPromise;
  }, [updateChatData, setIsTypingById, activeSendPromises]);


  /**
   * Arquiva o chat atual e cria um novo.
   * Limpa o estado local do chat antigo para evitar dados misturados.
   */
  const archiveAndStartNew = useCallback(async (chatId: string): Promise<string | null> => {
    try {
      const { new_chat_id } = await chatService.archiveAndCreateNewChat(chatId);
      
      // Limpa o estado do chat antigo da memória local do provider
      updateChatData(chatId, () => ({ messages: [], nextPage: 1 })); 
      
      // Opcional: Inicializar o estado do novo chat se necessário, 
      // mas o loadInitialMessages cuidará disso ao navegar.
      
      return new_chat_id;
    } catch (error) {
      console.error(`[ChatSender] Failed to archive chat:`, error);
      return null;
    }
  }, [updateChatData]);


  /**
   * Envia múltiplos anexos em lote.
   * Cria mensagens temporárias para cada anexo para feedback imediato.
   */
  const sendMultipleAttachments = useCallback(async (chatId: string, files: AttachmentPickerResult[]) => {
    if (!files.length) return;

    console.log(`[ChatSender] Sending ${files.length} attachments for chat ${chatId}`);

    // 1. Cria mensagens temporárias para TODOS os arquivos (Optimistic UI)
    const tempMessages: ChatMessage[] = files.map(file => ({
      id: `temp-att-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: '',
      created_at: new Date().toISOString(),
      attachment_url: file.uri,
      attachment_type: file.type || 'application/octet-stream',
      original_filename: file.name,
    }));

    const tempIds = new Set(tempMessages.map(m => m.id));

    // Atualiza UI imediatamente
    updateChatData(chatId, (prev) => ({
      messages: [...prev.messages, ...tempMessages],
    }));

    try {
      // 2. Chama o serviço de batch upload
      const apiReplies = await attachmentService.uploadBatchAttachments(chatId, files);
      
      if (!Array.isArray(apiReplies)) {
        throw new Error('Resposta inválida do servidor para upload em lote');
      }

      console.log('[ChatSender] Batch upload success. Updating messages.');

      // 3. Sucesso: Substitui temporários pelos reais
      updateChatData(chatId, (prev) => {
        // Remove TODOS os temporários criados neste lote
        const messagesClean = prev.messages.filter(m => !tempIds.has(m.id));
        
        // Filter duplicates from API response
        const existingIds = new Set(messagesClean.map(m => m.id));
        const uniqueReplies = apiReplies.filter(r => !existingIds.has(r.id));

        // Adiciona TODAS as respostas da API
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
      
      // 4. Erro: Remove os temporários e alerta o usuário
      // (Poderíamos implementar retry aqui, mas por simplicidade removemos)
      updateChatData(chatId, (prev) => ({
        messages: prev.messages.filter(m => !tempIds.has(m.id)),
      }));
      
      // Re-lança o erro para que a UI possa mostrar um Alert
      throw error;
    }
  }, [updateChatData]);


  // Wrapper de compatibilidade para envio único
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