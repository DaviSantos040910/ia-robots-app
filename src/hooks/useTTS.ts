// src/hooks/useTTS.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { chatService } from '../services/chatService';

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // CORREÇÃO DE RACE CONDITION:
  // Guarda o ID da mensagem que estamos tentando carregar no momento.
  // Se o usuário mudar de mensagem enquanto carregamos, sabemos que devemos abortar.
  const loadingMessageIdRef = useRef<string | null>(null);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const stopTTS = useCallback(async () => {
    // Cancela qualquer carregamento pendente
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
        // Se já estiver tocando ESTA mensagem, pausa/para
        if (isPlaying && currentMessageId === messageId) {
          await stopTTS();
          return;
        }

        // Para qualquer som anterior antes de começar o novo
        await stopTTS();

        // Inicia estado de carregamento seguro
        loadingMessageIdRef.current = messageId;
        setIsLoading(true);
        setCurrentMessageId(messageId);

        const audioBlob = await chatService.getMessageTTS(conversationId, messageId);

        // VERIFICAÇÃO CRÍTICA:
        // O usuário clicou em outra coisa ou cancelou enquanto baixávamos?
        if (loadingMessageIdRef.current !== messageId) {
          console.log('TTS cancelado ou trocado durante o download.');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);

        reader.onloadend = async () => {
          // VERIFICAÇÃO CRÍTICA 2:
          // O usuário cancelou enquanto líamos o blob?
          if (loadingMessageIdRef.current !== messageId) return;

          const base64Audio = reader.result as string;

          try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: base64Audio },
              { shouldPlay: true },
              (status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                  setIsPlaying(false);
                  setCurrentMessageId(null);
                  loadingMessageIdRef.current = null;
                }
              }
            );

            // VERIFICAÇÃO FINAL:
            // Se outro som começou a tocar nesse milissegundo, descarrega este imediatamente
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
        };

        reader.onerror = () => {
          console.error('Erro ao ler blob de áudio');
          setIsLoading(false);
          setCurrentMessageId(null);
        };
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