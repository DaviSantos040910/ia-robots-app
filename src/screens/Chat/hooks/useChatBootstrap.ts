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

  // Refs para controle de fluxo e prevenção de loops
  const initialLoadDoneForCurrentId = useRef<string | null>(null);
  const isLoadingData = useRef(false);

  const { 
    loadInitialMessages, 
    hasLoadedOnce 
  } = useChatController(currentChatId);

  // --- CORE LOGIC ---
  // Esta função carrega os dados. Ela NÃO deve ser dependência de um useEffect que roda sem critérios.
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
        // --- Modo Arquivado (Leitura) ---
        
        // Se o ID mudou, atualiza o estado e deixa o próximo render cuidar do resto
        if (currentChatId !== initialChatId) {
          setCurrentChatId(initialChatId ?? null);
          isLoadingData.current = false;
          return;
        }

        // Monta bootstrap manual apenas se necessário
        // Usamos setBootstrap funcional para evitar dependência do valor anterior
        setBootstrap(prev => {
            if (!prev || prev.conversationId !== initialChatId) {
                return {
                    conversationId: initialChatId || '',
                    bot: { name: botName, handle: botHandle, avatarUrl: botAvatarUrl },
                    welcome: t('archivedChats.title'),
                    suggestions: []
                };
            }
            return prev;
        });

        if (initialChatId) {
          await loadInitialMessages();
          initialLoadDoneForCurrentId.current = initialChatId;
        }

      } else {
        // --- Modo Ativo ---
        
        // Busca dados do servidor
        const fetchedBootstrapData = await botService.getChatBootstrap(botId);
        
        // Atualiza bootstrap apenas se mudou (evita re-render desnecessário)
        setBootstrap(prev => {
            if (prev?.conversationId !== fetchedBootstrapData.conversationId) {
                return fetchedBootstrapData;
            }
            return prev;
        });

        const chatDataToLoad = fetchedBootstrapData.conversationId;

        // Se o ID do chat ativo mudou, atualiza o estado principal
        if (currentChatId !== chatDataToLoad) {
          setCurrentChatId(chatDataToLoad);
          // Reseta a flag de carga para o novo ID
          initialLoadDoneForCurrentId.current = null;
          isLoadingData.current = false;
          // O hook rodará novamente no próximo render devido à mudança de currentChatId
          return; 
        }

        // Carrega mensagens
        await loadInitialMessages();
        initialLoadDoneForCurrentId.current = chatDataToLoad;
      }
    } catch (error) {
      console.error("[useChatBootstrap] Failed to load chat data:", error);
    } finally {
      isLoadingData.current = false;
      setIsScreenLoading(false);
    }
  }, [
    // Dependências Estáveis (Primitives ou Refs)
    botId,
    currentChatId, // Importante: reage a mudanças de ID interno
    initialChatId,
    isReadOnly,
    // Dependências de UI (apenas strings, não objetos complexos instáveis)
    botName,
    botHandle,
    botAvatarUrl,
    // Funções do Controller (já são estáveis pelo useMemo do Provider)
    loadInitialMessages,
    hasLoadedOnce,
    t,
  ]);

  // --- EFEITO PRINCIPAL ---
  // Este efeito dispara a carga inicial.
  // REMOVIDO: loadChatData das dependências para quebrar o ciclo se ele for recriado.
  // ADICIONADO: Flag lógica baseada em foco e IDs.
  useEffect(() => {
    if (isFocused) {
        // Só chama se o ID ainda não foi carregado ou se mudou
        const shouldLoad = initialLoadDoneForCurrentId.current !== currentChatId || !hasLoadedOnce;
        
        if (shouldLoad) {
            loadChatData(false);
        }
    }
  }, [
    isFocused, 
    currentChatId, 
    hasLoadedOnce, 
    // loadChatData // <--- REMOVIDO INTENCIONALMENTE PARA EVITAR LOOP
    // O useCallback do loadChatData já tem as dependências corretas para ser atualizado quando necessário.
    // Mas como ele é recriado quando 'bootstrap' muda (e ele mesmo muda bootstrap), isso causava o loop.
    // Ao removê-lo daqui, dependemos apenas das variáveis de controle (IDs, Foco).
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
    initialLoadDoneForCurrentId,
    // Exposto para refresh manual (pull-to-refresh, etc)
    loadChatData,
  };
};