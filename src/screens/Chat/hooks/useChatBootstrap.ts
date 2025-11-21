import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { botService } from '../../../services/botService';
import { ChatBootstrap } from '../../../types/chat';
import { useChatController } from '../../../contexts/chat/ChatProvider';

export type ManualBootstrap = {
  conversationId: string;
  bot: { name: string; handle: string; avatarUrl?: string | null };
  welcome: string;
  suggestions: string[];
};

type UseChatBootstrapProps = {
  chatId?: string;
  botId: string;
  isArchived?: boolean;
  botName: string;
  botHandle: string;
  botAvatarUrl?: string | null;
};

export const useChatBootstrap = ({
  chatId: initialChatId,
  botId,
  isArchived: initialIsArchived,
  botName,
  botHandle,
  botAvatarUrl,
}: UseChatBootstrapProps) => {
  const { t } = useTranslation();
  const isFocused = useIsFocused();

  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId ?? null);
  const [bootstrap, setBootstrap] = useState<ChatBootstrap | ManualBootstrap | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(initialIsArchived ?? false);
  const [isScreenLoading, setIsScreenLoading] = useState(true);

  const initialLoadDoneForCurrentId = useRef<string | null>(null);
  const isLoadingData = useRef(false);

  const { 
    loadInitialMessages, 
    // Removido: clearLocalChatState - Não vamos limpar automaticamente ao entrar para preservar cache em memória se existir
    hasLoadedOnce 
  } = useChatController(currentChatId);

  const loadChatData = useCallback(async (forceRefresh: boolean = false) => {
    if (isLoadingData.current && !forceRefresh) return;
    if (!botId) { setIsScreenLoading(false); return; }

    // Se já carregamos e não é um refresh forçado, apenas retorna
    if (!forceRefresh && initialLoadDoneForCurrentId.current === currentChatId && hasLoadedOnce) {
      setIsScreenLoading(false);
      return;
    }

    isLoadingData.current = true;
    // Apenas mostra loading screen se realmente não tivermos dados carregados ainda
    if (!hasLoadedOnce) {
        setIsScreenLoading(true);
    }

    try {
      if (isReadOnly) {
        if (currentChatId !== initialChatId) {
          setCurrentChatId(initialChatId ?? null);
          isLoadingData.current = false;
          return;
        }

        if (!bootstrap || bootstrap.conversationId !== initialChatId) {
          const manualBootstrap: ManualBootstrap = {
            conversationId: initialChatId || '',
            bot: { name: botName, handle: botHandle, avatarUrl: botAvatarUrl },
            welcome: t('archivedChats.title'),
            suggestions: []
          };
          setBootstrap(manualBootstrap);
        }

        if (initialChatId) {
          await loadInitialMessages();
          initialLoadDoneForCurrentId.current = initialChatId;
        }

      } else {
        // Chat Ativo
        const fetchedBootstrapData = await botService.getChatBootstrap(botId);
        setBootstrap(fetchedBootstrapData);
        const chatDataToLoad = fetchedBootstrapData.conversationId;

        if (currentChatId !== chatDataToLoad) {
          setCurrentChatId(chatDataToLoad);
          initialLoadDoneForCurrentId.current = null;
          isLoadingData.current = false;
          // O hook rodará novamente com o novo ID
          return; 
        }

        // Carrega mensagens
        await loadInitialMessages();
        initialLoadDoneForCurrentId.current = chatDataToLoad;
      }
    } catch (error) {
      console.error("[useChatBootstrap] Failed to load chat data:", error);
      // Não mostramos alerta aqui para não interromper o fluxo se for um erro menor de rede,
      // o useChatLoader já lida com erros de mensagem.
    } finally {
      isLoadingData.current = false;
      setIsScreenLoading(false);
    }
  }, [
    botId,
    currentChatId,
    initialChatId,
    isReadOnly,
    bootstrap,
    botName,
    botHandle,
    botAvatarUrl,
    loadInitialMessages,
    hasLoadedOnce,
    t,
  ]);

  useEffect(() => {
    if (isFocused) {
      loadChatData(false); // Passa false para não forçar reload se já tiver dados
    }
  }, [isFocused, currentChatId, loadChatData]);

  return {
    currentChatId,
    setCurrentChatId,
    bootstrap,
    setBootstrap,
    isReadOnly,
    setIsReadOnly,
    isScreenLoading,
    setIsScreenLoading,
    initialLoadDoneForCurrentId,
    loadChatData,
  };
};