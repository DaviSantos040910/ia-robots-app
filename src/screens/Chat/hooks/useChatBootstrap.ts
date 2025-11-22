import { useState, useCallback, useEffect, useRef } from 'react';
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

  // --- CONTROLE DE CONCORRÊNCIA E CACHE (REFS) ---
  const isFetchingRef = useRef(false);
  const lastLoadedBotIdRef = useRef<string | null>(null);
  
  // Ref exposta para reset manual no componente pai se necessário
  const initialLoadDoneForCurrentId = useRef<string | null>(null);

  const { 
    loadInitialMessages, 
    hasLoadedOnce 
  } = useChatController(currentChatId);

  // --- CORE LOGIC ---
  const loadChatData = useCallback(async (forceRefresh: boolean = false) => {
    // 1. Verificação de Segurança
    if (isFetchingRef.current) {
      console.log('[ChatBootstrap] Request ignorado: Já existe um fetch em andamento.');
      return;
    }

    // 2. Verificação de Cache em Memória
    if (
        !forceRefresh && 
        lastLoadedBotIdRef.current === botId && 
        hasLoadedOnce &&
        bootstrap?.bot.name
    ) {
      console.log('[ChatBootstrap] Request ignorado: Dados já carregados e estáveis.');
      setIsScreenLoading(false);
      return;
    }

    isFetchingRef.current = true;
    
    if (!hasLoadedOnce) {
        setIsScreenLoading(true);
    }

    try {
      if (isReadOnly) {
        if (currentChatId !== initialChatId) {
          setCurrentChatId(initialChatId ?? null);
        }

        setBootstrap({
            conversationId: initialChatId || '',
            bot: { name: botName, handle: botHandle, avatarUrl: botAvatarUrl },
            welcome: t('archivedChats.title'),
            suggestions: []
        });

        if (initialChatId) {
          await loadInitialMessages();
        }

        lastLoadedBotIdRef.current = botId;
        initialLoadDoneForCurrentId.current = initialChatId || null;

      } else {
        console.log(`[ChatBootstrap] Iniciando fetch para BotID: ${botId}`);
        const fetchedBootstrapData = await botService.getChatBootstrap(botId);
        
        if (lastLoadedBotIdRef.current && lastLoadedBotIdRef.current !== botId) {
             console.log('[ChatBootstrap] Descartando resultado: BotID mudou durante o fetch.');
             return; 
        }

        setBootstrap(fetchedBootstrapData);
        const chatDataToLoad = fetchedBootstrapData.conversationId;

        if (currentChatId !== chatDataToLoad) {
          setCurrentChatId(chatDataToLoad);
        }

        await loadInitialMessages();
        
        lastLoadedBotIdRef.current = botId;
        initialLoadDoneForCurrentId.current = chatDataToLoad;
      }
    } catch (error) {
      console.error("[useChatBootstrap] Failed to load chat data:", error);
    } finally {
      isFetchingRef.current = false;
      setIsScreenLoading(false);
    }
  }, [
    botId,
    initialChatId,
    isReadOnly,
    botName,
    botHandle,
    botAvatarUrl,
    loadInitialMessages,
    hasLoadedOnce,
    t,
    currentChatId,
    bootstrap
  ]);

  useEffect(() => {
    let isMounted = true;

    if (isFocused) {
        loadChatData();
    }

    return () => {
        isMounted = false;
        isFetchingRef.current = false;
    };
  }, [
    isFocused, 
    botId,
  ]);

  return {
    currentChatId,
    setCurrentChatId,
    bootstrap,
    setBootstrap,
    isReadOnly,
    setIsReadOnly,
    isScreenLoading,
    setIsScreenLoading,
    initialLoadDoneForCurrentId, // ADICIONADO AQUI
    resetBootstrap: () => { lastLoadedBotIdRef.current = null; loadChatData(true); },
    loadChatData,
  };
};