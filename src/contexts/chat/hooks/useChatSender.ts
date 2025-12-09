// hooks/useChatSender.ts
/**
 * Hook para gerenciar envio de mensagens no chat.
 * Suporta texto, áudio e anexos com streaming.
 */

import 'react-native-get-random-values';
import { useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ChatMessage } from '../../../types/chat';
import { chatService } from '../../../services/chatService';
import { attachmentService, AttachmentPickerResult } from '../../../services/attachmentService';
import { setCachedChatData } from '../../../services/chatCacheService';
import { ChatData } from './useChatState';
import { streamMessage, StreamMetadata } from '../../../services/streamApi';

/** Dependências do hook */
type UseChatSenderDeps = {
    updateChatData: (chatId: string, updater: (prevData: ChatData) => Partial<ChatData>) => void;
    setIsTypingById: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    activeSendPromises: React.MutableRefObject<Record<string, Promise<void> | undefined>>;
    isBotVoiceMode: boolean;
};

export const useChatSender = ({
    updateChatData,
    setIsTypingById,
    activeSendPromises,
    isBotVoiceMode,
}: UseChatSenderDeps) => {
    // Refs para valores atuais
    const voiceModeRef = useRef(isBotVoiceMode);
    const cancelStreamRef = useRef<(() => void) | null>(null);

    // Sincronizar ref com prop
    useEffect(() => {
        voiceModeRef.current = isBotVoiceMode;
    }, [isBotVoiceMode]);

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            if (cancelStreamRef.current) {
                cancelStreamRef.current();
                cancelStreamRef.current = null;
            }
        };
    }, []);

    /**
     * Finaliza atualização de mensagens após resposta da API.
     */
    const finalizeMessageUpdate = useCallback((
        chatId: string,
        tempUserId: string,
        apiReplies: ChatMessage[]
    ) => {
        updateChatData(chatId, (prev) => {
            const messagesWithoutTemp = prev.messages.filter(m => m.id !== tempUserId);
            const existingIds = new Set(messagesWithoutTemp.map(m => m.id));
            const uniqueReplies = apiReplies.filter(r => !existingIds.has(r.id));
            const newFinalMessages = [...messagesWithoutTemp, ...uniqueReplies];

            // Atualizar cache
            setCachedChatData(chatId, {
                messages: newFinalMessages,
                nextPage: prev.nextPage,
                timestamp: Date.now(),
            }).catch(err => console.error('[ChatSender] Cache update failed:', err));

            return { messages: newFinalMessages };
        });
    }, [updateChatData]);

    /**
     * Trata erros no envio de mensagens.
     */
    const handleSendError = useCallback((
        chatId: string,
        targetId: string,
        error: unknown,
        removeTarget = false
    ) => {
        console.error('[ChatSender] Error:', error);

        if (removeTarget) {
            updateChatData(chatId, (prev) => ({
                messages: prev.messages.filter(m => m.id !== targetId)
            }));
        } else {
            const errorMsg: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: 'Falha ao processar resposta.',
                created_at: new Date().toISOString()
            };
            updateChatData(chatId, (prev) => ({
                messages: prev.messages.map(m => m.id === targetId ? errorMsg : m)
            }));
        }
    }, [updateChatData]);

    /**
     * Processa envio de mensagem de texto.
     * Usa streaming por padrão, exceto em modo de voz.
     */
    const processTextMessage = useCallback(async (chatId: string, text: string) => {
        const tempUserMsgId = uuidv4();
        const tempUserMsg: ChatMessage = {
            id: tempUserMsgId,
            role: 'user',
            content: text,
            created_at: new Date().toISOString(),
        };

        // Adicionar mensagem do usuário imediatamente
        updateChatData(chatId, (prev) => ({
            messages: [...prev.messages, tempUserMsg],
        }));

        const shouldReplyWithAudio = voiceModeRef.current;

        // Modo de voz: usa API tradicional (não streaming)
        if (shouldReplyWithAudio) {
            setIsTypingById((prev) => ({ ...prev, [chatId]: true }));
            try {
                const apiReplies = await chatService.sendMessage(chatId, text, true);
                finalizeMessageUpdate(chatId, tempUserMsgId, apiReplies);
            } catch (error) {
                handleSendError(chatId, tempUserMsgId, error);
            } finally {
                setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
            }
            return;
        }

        // Modo texto: usa streaming SSE
        setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

        const tempBotId = `temp-stream-${Date.now()}`;
        const tempBotMsg: ChatMessage = {
            id: tempBotId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
        };

        // Adicionar placeholder da resposta do bot
        updateChatData(chatId, (prev) => ({
            messages: [...prev.messages, tempBotMsg],
        }));

        try {
            let isFirstChunk = true;

            const cancel = await streamMessage(chatId, text, {
                onChunk: (textChunk: string) => {
                    // Desativar "digitando" no primeiro chunk
                    if (isFirstChunk) {
                        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
                        isFirstChunk = false;
                    }

                    // Acumular texto
                    updateChatData(chatId, (prev) => ({
                        messages: prev.messages.map(msg => {
                            if (msg.id === tempBotId) {
                                return { ...msg, content: msg.content + textChunk };
                            }
                            return msg;
                        })
                    }));
                },

                onFinish: (metadata: StreamMetadata) => {
                    setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

                    updateChatData(chatId, (prev) => {
                        const finalMessages = prev.messages.map(msg => {
                            if (msg.id === tempBotId) {
                                return {
                                    ...msg,
                                    id: metadata.message_id || uuidv4(),
                                    content: metadata.clean_content || msg.content,
                                    suggestions: metadata.suggestions || []
                                };
                            }
                            return msg;
                        });

                        // Atualizar cache
                        setCachedChatData(chatId, {
                            messages: finalMessages,
                            nextPage: prev.nextPage,
                            timestamp: Date.now(),
                        }).catch(console.error);

                        return { messages: finalMessages };
                    });

                    cancelStreamRef.current = null;
                },

                onError: (error: Error) => {
                    console.error('[ChatSender] Stream error:', error);
                    setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
                    handleSendError(chatId, tempBotId, error, true);
                    cancelStreamRef.current = null;
                }
            });

            cancelStreamRef.current = cancel || null;
        } catch (error) {
            setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
            handleSendError(chatId, tempUserMsgId, error);
        }
    }, [updateChatData, setIsTypingById, finalizeMessageUpdate, handleSendError]);

    /**
     * Envia mensagem de texto.
     */
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

    /**
     * Envia mensagem de voz.
     */
    const sendVoiceMessage = useCallback(async (
        chatId: string,
        audioUri: string,
        durationMs: number,
        replyWithAudio: boolean
    ) => {
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

        updateChatData(chatId, (prev) => ({
            messages: [...prev.messages, tempMessage]
        }));

        setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

        try {
            const apiMessages = await chatService.sendVoiceMessage(
                chatId,
                audioUri,
                durationMs,
                replyWithAudio
            );
            finalizeMessageUpdate(chatId, tempId, apiMessages);
        } catch (error) {
            handleSendError(chatId, tempId, error);
        } finally {
            setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
        }
    }, [updateChatData, setIsTypingById, finalizeMessageUpdate, handleSendError]);

    /**
     * Arquiva chat atual e cria um novo.
     */
    const archiveAndStartNew = useCallback(async (chatId: string): Promise<string | null> => {
        try {
            const { new_chat_id } = await chatService.archiveAndCreateNewChat(chatId);
            updateChatData(chatId, () => ({ messages: [], nextPage: 1 }));
            return new_chat_id;
        } catch (error) {
            console.error('[ChatSender] Archive error:', error);
            return null;
        }
    }, [updateChatData]);

    /**
     * Envia múltiplos anexos.
     */
    const sendMultipleAttachments = useCallback(async (
        chatId: string,
        files: AttachmentPickerResult[]
    ) => {
        if (!files.length) return;

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
            messages: [...prev.messages, ...tempMessages]
        }));

        try {
            const apiReplies = await attachmentService.uploadBatchAttachments(chatId, files);

            updateChatData(chatId, (prev) => {
                const messagesClean = prev.messages.filter(m => !tempIds.has(m.id));
                const existingIds = new Set(messagesClean.map(m => m.id));
                const uniqueReplies = apiReplies.filter(r => !existingIds.has(r.id));
                const finalMessages = [...messagesClean, ...uniqueReplies];

                setCachedChatData(chatId, {
                    messages: finalMessages,
                    nextPage: prev.nextPage,
                    timestamp: Date.now()
                }).catch(console.error);

                return { messages: finalMessages };
            });
        } catch (error) {
            updateChatData(chatId, (prev) => ({
                messages: prev.messages.filter(m => !tempIds.has(m.id))
            }));
            throw error;
        }
    }, [updateChatData]);

    /**
     * Envia mensagem combinada (texto + anexos).
     */
    const sendCombinedMessage = useCallback(async (
        chatId: string,
        text: string,
        attachments: AttachmentPickerResult[]
    ) => {
        if (activeSendPromises.current[chatId]) return;

        const flowPromise = (async () => {
            try {
                if (attachments.length > 0) {
                    await sendMultipleAttachments(chatId, attachments);
                }
                if (text.trim().length > 0) {
                    await processTextMessage(chatId, text);
                }
            } finally {
                delete activeSendPromises.current[chatId];
            }
        })();

        activeSendPromises.current[chatId] = flowPromise;
        return flowPromise;
    }, [activeSendPromises, sendMultipleAttachments, processTextMessage]);

    /**
     * Envia um único anexo.
     */
    const sendAttachment = useCallback(async (
        chatId: string,
        file: AttachmentPickerResult
    ) => {
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
