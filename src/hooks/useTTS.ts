// src/hooks/useTTS.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy'; // Necessário para salvar o cache local
import { chatService } from '../services/chatService';

const MAX_CACHE_SIZE = 10;

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadingMessageIdRef = useRef<string | null>(null);

  // --- FASE 3.2: Cache LRU Simples ---
  // Mapa: Chave (chatId-msgId) -> Valor (URI local do arquivo)
  const ttsCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const stopTTS = useCallback(async () => {
    loadingMessageIdRef.current = null;
    
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.warn('Erro ao parar som:', error);
      }
      soundRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentMessageId(null);
  }, []);

  const playTTS = useCallback(
    async (conversationId: string, messageId: string) => {
      try {
        if (isPlaying && currentMessageId === messageId) {
          await stopTTS();
          return;
        }

        await stopTTS();

        loadingMessageIdRef.current = messageId;
        setIsLoading(true);
        setCurrentMessageId(messageId);

        // --- Lógica de Cache ---
        const cacheKey = `${conversationId}-${messageId}`;
        let audioUri = ttsCache.current.get(cacheKey);

        if (!audioUri) {
            // Se não está no cache, busca na API
            const audioBlob = await chatService.getMessageTTS(conversationId, messageId);
            
            if (loadingMessageIdRef.current !== messageId) return;

            // Converte Blob para Base64 e salva em arquivo temporário para cachear
            const reader = new FileReader();
            
            await new Promise<void>((resolve, reject) => {
                reader.onloadend = async () => {
                    try {
                        const base64Data = (reader.result as string).split(',')[1];
                        const fileUri = `${FileSystem.cacheDirectory}tts_${cacheKey}.wav`;
                        
                        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                            encoding: FileSystem.EncodingType.Base64
                        });
                        
                        audioUri = fileUri;
                        
                        // Atualiza cache LRU
                        if (ttsCache.current.size >= MAX_CACHE_SIZE) {
                            const firstKey = ttsCache.current.keys().next().value;
                            if (firstKey) ttsCache.current.delete(firstKey); // Remove o mais antigo
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
            console.log(`[TTS] Usando cache para ${messageId}`);
        }

        // Verifica novamente cancelamento
        if (loadingMessageIdRef.current !== messageId || !audioUri) return;

        try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: audioUri },
              { shouldPlay: true },
              (status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                  setIsPlaying(false);
                  setCurrentMessageId(null);
                  loadingMessageIdRef.current = null;
                }
              }
            );

            if (loadingMessageIdRef.current !== messageId) {
                await sound.unloadAsync();
                return;
            }

            soundRef.current = sound;
            setIsPlaying(true);
            setIsLoading(false);
        } catch (soundError) {
             console.error('Erro ao criar som:', soundError);
             setIsLoading(false);
             setCurrentMessageId(null);
        }

      } catch (error) {
        console.error('Erro ao tocar TTS:', error);
        setIsLoading(false);
        setCurrentMessageId(null);
      }
    },
    [isPlaying, currentMessageId, stopTTS]
  );

  return {
    playTTS,
    stopTTS,
    isPlaying,
    isLoading,
    currentMessageId,
  };
};