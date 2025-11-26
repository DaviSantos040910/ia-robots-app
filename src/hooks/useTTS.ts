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
  const ttsCache = useRef<Map<string, string>>(new Map());
  
  // --- CORREÇÃO DE CONCORRÊNCIA ---
  // Ref para atuar como um "Mutex" (Lock), impedindo operações sobrepostas
  const loadingOperationRef = useRef(false);

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
    
    try {
      // Se houver um som carregado, tenta parar e descarregar
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.stopAsync();
          }
          await soundRef.current.unloadAsync();
        }
        soundRef.current = null;
      }
    } catch (error) {
      console.warn('[TTS] Erro ao parar som (ignorado):', error);
      // Mesmo com erro, garantimos que a referência é nula
      soundRef.current = null;
    } finally {
      // 3. Atualiza o estado da UI
      setIsPlaying(false);
      setIsLoading(false);
      setCurrentMessageId(null);
    }
  }, []);

  /**
   * Inicia a reprodução de uma mensagem específica.
   * Lida com cache, download e toggle (play/pause) com proteção de concorrência.
   */
  const playTTS = useCallback(
    async (conversationId: string, messageId: string) => {
      // --- 1. Guard Clause (Mutex Check) ---
      // Se já existe uma operação de loading/play em andamento, ignoramos novos cliques.
      if (loadingOperationRef.current) {
        console.log('[TTS] Operação em andamento. Clique ignorado.');
        return;
      }

      try {
        // --- 2. Bloqueia novas operações ---
        loadingOperationRef.current = true;

        // --- 3. Lógica de Toggle (Play/Stop) ---
        // Se o usuário clicou na mesma mensagem que já está ativa, paramos.
        if (currentMessageId === messageId) {
          console.log(`[TTS] Toggle na mensagem ${messageId}: Parando.`);
          await stopTTS();
          return; // Retorna no finally para liberar o lock
        }

        // --- 4. Cleanup Prévio Obrigatório ---
        // Antes de tentar carregar qualquer coisa nova, garantimos que o canal está limpo.
        if (soundRef.current) {
          console.log('[TTS] Limpando áudio anterior antes de iniciar novo...');
          try {
            await soundRef.current.unloadAsync();
          } catch (e) {
            console.warn('[TTS] Erro no unload preventivo:', e);
          }
          soundRef.current = null;
        }

        // Atualiza UI para estado de carregamento
        setIsLoading(true);
        setCurrentMessageId(messageId);
        setIsPlaying(false); // Garante false enquanto carrega

        console.log(`[TTS] Iniciando playback para: ${messageId}`);

        // --- 5. Lógica de Cache e Download ---
        const cacheKey = `${conversationId}-${messageId}`;
        let audioUri = ttsCache.current.get(cacheKey);

        if (!audioUri) {
          console.log(`[TTS] Cache miss para ${messageId}. Baixando...`);
          
          // Download do Blob
          const audioBlob = await chatService.getMessageTTS(conversationId, messageId);

          // Leitura do Blob e salvamento
          const reader = new FileReader();
          
          await new Promise<void>((resolve, reject) => {
            reader.onloadend = async () => {
              try {
                const base64Data = (reader.result as string).split(',')[1];
                const fileUri = `${FileSystem.cacheDirectory}tts_${cacheKey}.wav`;

                await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                  encoding: FileSystem.EncodingType.Base64,
                });

                audioUri = fileUri;

                // Atualiza Cache LRU
                if (ttsCache.current.size >= MAX_CACHE_SIZE) {
                  const firstKey = ttsCache.current.keys().next().value;
                  if (firstKey) ttsCache.current.delete(firstKey);
                }
                ttsCache.current.set(cacheKey, audioUri);
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

        if (!audioUri) {
          throw new Error('Falha ao obter URI do áudio');
        }

        // --- 6. Configura e Toca o Áudio ---
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
              console.log('[TTS] Playback finalizado naturalmente.');
              setIsPlaying(false);
              setCurrentMessageId(null);
              // Não precisamos descarregar imediatamente aqui, o próximo play fará isso,
              // ou o cleanup do useEffect. Mas podemos fazer por boa prática:
              soundRef.current?.unloadAsync().catch(() => {});
              soundRef.current = null;
            }
          }
        );

        soundRef.current = sound;
        setIsPlaying(true);
        setIsLoading(false);
        console.log('[TTS] Áudio tocando...');

      } catch (error) {
        console.error('[TTS] Erro crítico no processo:', error);
        // Rollback de estado em caso de erro
        setIsLoading(false);
        setIsPlaying(false);
        setCurrentMessageId(null);
        
        if (soundRef.current) {
            try { await soundRef.current.unloadAsync(); } catch (e) {}
            soundRef.current = null;
        }
      } finally {
        // --- 7. Libera o Lock ---
        loadingOperationRef.current = false;
      }
    },
    [currentMessageId, stopTTS]
  );

  return {
    playTTS,
    stopTTS,
    isPlaying,
    isLoading,
    currentMessageId,
  };
};