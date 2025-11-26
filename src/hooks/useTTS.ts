// src/hooks/useTTS.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { chatService } from '../services/chatService';

const MAX_CACHE_SIZE = 10;

export const useTTS = () => {
  // Estados para a UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

  // Refs para controle interno (não disparam re-render)
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadingMessageIdRef = useRef<string | null>(null);
  const ttsCache = useRef<Map<string, string>>(new Map());

  // Limpeza ao desmontar o hook/componente
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  /**
   * Para a reprodução atual e limpa o estado.
   * É uma função crítica que deve garantir que o som anterior morra.
   */
  const stopTTS = useCallback(async () => {
    console.log('[TTS] Parando reprodução...');
    
    // 1. Invalida qualquer carregamento pendente IMEDIATAMENTE
    loadingMessageIdRef.current = null;

    // 2. Se houver um som carregado, tenta parar e descarregar
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.stopAsync();
          }
          await soundRef.current.unloadAsync();
        }
      } catch (error) {
        console.warn('[TTS] Erro ao parar som (ignorado):', error);
      }
      soundRef.current = null;
    }

    // 3. Atualiza o estado da UI
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentMessageId(null);
  }, []);

  /**
   * Inicia a reprodução de uma mensagem específica.
   * Lida com cache, download e toggle (play/pause).
   */
  const playTTS = useCallback(
    async (conversationId: string, messageId: string) => {
      try {
        // --- LÓGICA DE TOGGLE (PLAY/PAUSE) ---

        // Cenário 1: O usuário clicou na MESMA mensagem que já está ativa.
        // Se estiver tocando OU carregando essa mensagem, a ação é PARAR.
        if (currentMessageId === messageId) {
          console.log(`[TTS] Toggle na mensagem ${messageId}: Parando.`);
          await stopTTS();
          return;
        }

        // Cenário 2: O usuário clicou em uma mensagem DIFERENTE.
        // Primeiro, paramos qualquer coisa que esteja acontecendo antes.
        if (isPlaying || isLoading || currentMessageId) {
          console.log(`[TTS] Trocando de mensagem (Antiga: ${currentMessageId} -> Nova: ${messageId}). Parando anterior...`);
          await stopTTS();
        }

        // --- INÍCIO DO NOVO PLAYBACK ---
        console.log(`[TTS] Iniciando playback para: ${messageId}`);

        // Define a "intenção" atual. Se loadingMessageIdRef mudar durante o processo assíncrono,
        // significa que o usuário cancelou ou trocou de mensagem, e devemos abortar.
        loadingMessageIdRef.current = messageId;

        setIsLoading(true);
        setCurrentMessageId(messageId);

        // 1. Verifica Cache Local
        const cacheKey = `${conversationId}-${messageId}`;
        let audioUri = ttsCache.current.get(cacheKey);

        if (!audioUri) {
          // Cache Miss: Precisa baixar da API
          console.log(`[TTS] Cache miss para ${messageId}. Baixando...`);
          
          // Download do Blob
          const audioBlob = await chatService.getMessageTTS(conversationId, messageId);

          // Checkpoint 1: Usuário cancelou/trocou durante o download?
          if (loadingMessageIdRef.current !== messageId) {
            console.log('[TTS] Abortado após download (usuário trocou/parou).');
            return;
          }

          // Leitura do Blob (Conversão para Base64 para salvar localmente)
          const reader = new FileReader();
          
          await new Promise<void>((resolve, reject) => {
            reader.onloadend = async () => {
              try {
                // Checkpoint 2: Usuário cancelou durante a leitura?
                if (loadingMessageIdRef.current !== messageId) {
                  resolve(); // Resolve sem erro, mas não faz nada
                  return;
                }

                const base64Data = (reader.result as string).split(',')[1];
                const fileUri = `${FileSystem.cacheDirectory}tts_${cacheKey}.wav`;

                // Salva no sistema de arquivos do dispositivo
                await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                  encoding: FileSystem.EncodingType.Base64,
                });

                audioUri = fileUri;

                // Atualiza Cache LRU (Remove o mais antigo se cheio)
                if (ttsCache.current.size >= MAX_CACHE_SIZE) {
                  const firstKey = ttsCache.current.keys().next().value;
                  if (firstKey) ttsCache.current.delete(firstKey);
                }
                ttsCache.current.set(cacheKey, audioUri);
                console.log(`[TTS] Salvo no cache: ${cacheKey}`);

                resolve();
              } catch (e) {
                reject(e);
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });
        } else {
          console.log(`[TTS] Cache hit para ${messageId}.`);
        }

        // Checkpoint 3: Validação final antes de criar o som
        if (loadingMessageIdRef.current !== messageId || !audioUri) {
          console.log('[TTS] Abortado antes de criar objeto de som.');
          return;
        }

        // 2. Configura e Toca o Áudio
        try {
          // Garante que o áudio toque mesmo no modo silencioso do iOS
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });

          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true },
            (status: any) => {
              if (status.isLoaded && status.didJustFinish) {
                // Callback quando o áudio termina naturalmente
                console.log('[TTS] Playback finalizado naturalmente.');
                setIsPlaying(false);
                setCurrentMessageId(null);
                loadingMessageIdRef.current = null;
                sound.unloadAsync(); // Libera recursos
                soundRef.current = null;
              }
            }
          );

          // Checkpoint 4: Race condition final (usuário clicou muito rápido enquanto carregava o som)
          if (loadingMessageIdRef.current !== messageId) {
            console.log('[TTS] Abortado logo após criar som. Descarregando.');
            await sound.unloadAsync();
            return;
          }

          soundRef.current = sound;
          setIsPlaying(true);
          setIsLoading(false);
          console.log('[TTS] Áudio tocando...');

        } catch (soundError) {
          console.error('[TTS] Erro crítico ao criar som:', soundError);
          // Limpeza de erro
          setIsLoading(false);
          setCurrentMessageId(null);
          loadingMessageIdRef.current = null;
        }

      } catch (error) {
        console.error('[TTS] Erro geral no processo:', error);
        // Fallback de limpeza
        setIsLoading(false);
        setCurrentMessageId(null);
        loadingMessageIdRef.current = null;
      }
    },
    [isPlaying, isLoading, currentMessageId, stopTTS]
  );

  return {
    playTTS,
    stopTTS,
    isPlaying,
    isLoading,
    currentMessageId,
  };
};