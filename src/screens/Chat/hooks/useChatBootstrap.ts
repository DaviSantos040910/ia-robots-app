import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { botService } from '../../../services/botService';
import { ChatBootstrap } from '../../../types/chat';
import { useChatController } from '../../../contexts/chat/ChatProvider';

// Tipo auxiliar para quando montamos o objeto bootstrap manualmente (modo arquivado)
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

  // --- State ---
  // Mantém o ID do chat atual, que pode mudar (ex: ao desarquivar ou criar novo)
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId ?? null);
  
  // Dados de configuração do chat (bot, boas-vindas, sugestões)
  const [bootstrap, setBootstrap] = useState<ChatBootstrap | ManualBootstrap | null>(null);
  
  // Define se a tela está em modo somente leitura (histórico)
  const [isReadOnly, setIsReadOnly] = useState(initialIsArchived ?? false);
  
  // Controle de carregamento da tela inteira
  const [isScreenLoading, setIsScreenLoading] = useState(true);

  // --- Refs para controle de fluxo de dados ---
  const initialLoadDoneForCurrentId = useRef<string | null>(null);
  const isLoadingData = useRef(false);

  // --- Integração com o Controller Global ---
  // Passamos o currentChatId para obter os métodos e estados específicos desse chat
  const { 
    loadInitialMessages, 
    clearLocalChatState, 
    hasLoadedOnce 
  } = useChatController(currentChatId);

  /**
   * Função principal para carregar os dados do chat.
   * Decide entre buscar dados do servidor (chat ativo) ou montar manualmente (arquivado).
   */
  const loadChatData = useCallback(async (isTriggeredByFocusOrActivation: boolean = false) => {
    // Evita carregamentos concorrentes, a menos que forçado por foco/ativação
    if (isLoadingData.current && !isTriggeredByFocusOrActivation) return;
    
    if (!botId) { 
      setIsScreenLoading(false); 
      return; 
    }

    // Se já carregamos este chat e temos dados em cache, não mostra loading de tela cheia
    // Isso evita "piscar" a tela quando o usuário volta de outra aba
    if (isTriggeredByFocusOrActivation && initialLoadDoneForCurrentId.current === currentChatId && hasLoadedOnce) {
      setIsScreenLoading(false);
      return;
    }

    isLoadingData.current = true;
    
    // Mostra loading se mudamos de chat ou é a primeira carga
    if (initialLoadDoneForCurrentId.current !== currentChatId) {
      setIsScreenLoading(true);
    }

    try {
      if (isReadOnly) {
        // --- Lógica para Chat Arquivado (ReadOnly) ---
        
        // Se o ID mudou externamente, atualiza e reinicia o ciclo
        if (currentChatId !== initialChatId) {
          setCurrentChatId(initialChatId ?? null);
          isLoadingData.current = false;
          return;
        }

        // Monta o objeto bootstrap manualmente para chats arquivados (já que não chamamos a API de bootstrap)
        if (!bootstrap || bootstrap.conversationId !== initialChatId) {
          const manualBootstrap: ManualBootstrap = {
            conversationId: initialChatId || '',
            bot: { name: botName, handle: botHandle, avatarUrl: botAvatarUrl },
            welcome: t('archivedChats.title'), // Título genérico para chats arquivados
            suggestions: []
          };
          setBootstrap(manualBootstrap);
        }

        // Carrega as mensagens se ainda não carregou para este ID
        if (initialLoadDoneForCurrentId.current !== initialChatId && initialChatId) {
          clearLocalChatState(initialChatId);
          await loadInitialMessages(); // Chama o controller global
          initialLoadDoneForCurrentId.current = initialChatId;
        }

      } else {
        // --- Lógica para Chat Ativo ---
        
        let chatDataToLoad: string | null = null;
        let fetchedBootstrapData: ChatBootstrap | null = null;

        // Busca dados de bootstrap do servidor (cria ou recupera chat ativo)
        fetchedBootstrapData = await botService.getChatBootstrap(botId);
        setBootstrap(fetchedBootstrapData);
        chatDataToLoad = fetchedBootstrapData.conversationId;

        // Se o chat retornado for diferente do atual, atualiza o estado
        if (currentChatId !== chatDataToLoad) {
          setCurrentChatId(chatDataToLoad);
          initialLoadDoneForCurrentId.current = null;
          isLoadingData.current = false;
          return; // O useEffect vai rodar novamente com o novo ID
        }

        // Carrega as mensagens se necessário
        const needsLoad = chatDataToLoad && initialLoadDoneForCurrentId.current !== chatDataToLoad;
        if (needsLoad && chatDataToLoad) {
          clearLocalChatState(chatDataToLoad);
          await loadInitialMessages(); // Chama o controller global
          initialLoadDoneForCurrentId.current = chatDataToLoad;
        }
      }
    } catch (error) {
      console.error("[useChatBootstrap] Failed to load chat data:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do chat.");
      initialLoadDoneForCurrentId.current = null;
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
    clearLocalChatState,
    hasLoadedOnce,
    t,
  ]);

  // --- Effects ---

  // Recarrega dados quando a tela ganha foco (ex: voltando de configurações)
  useEffect(() => {
    if (isFocused) {
      loadChatData(true);
    } else {
      // Reseta o ref para garantir refresh se o usuário sair e voltar
      // Mas mantém o estado visual intacto enquanto não foca
      initialLoadDoneForCurrentId.current = null; 
    }
  }, [isFocused, currentChatId, isReadOnly, loadChatData]);

  return {
    currentChatId,
    setCurrentChatId,
    bootstrap,
    setBootstrap,
    isReadOnly,
    setIsReadOnly,
    isScreenLoading,
    setIsScreenLoading,
    initialLoadDoneForCurrentId, // Exposto caso precise ser resetado externamente (ex: ao criar novo chat)
    loadChatData,
  };
};