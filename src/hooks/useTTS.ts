// src/hooks/useTTS.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { chatService } from '../services/chatService'; // ✅ Usando chatService

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playTTS = useCallback(
    async (conversationId: string, messageId: string) => {
      try {
        if (isPlaying && currentMessageId === messageId) {
          if (soundRef.current) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          }
          return;
        }

        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        setIsLoading(true);
        setCurrentMessageId(messageId);

        // ✅ Usando chatService
        const audioBlob = await chatService.getMessageTTS(conversationId, messageId);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);

        reader.onloadend = async () => {
          const base64Audio = reader.result as string;

          const { sound } = await Audio.Sound.createAsync(
            { uri: base64Audio },
            { shouldPlay: true },
            (status: any) => {
              if (status.isLoaded && status.didJustFinish) {
                setIsPlaying(false);
                setCurrentMessageId(null);
              }
            }
          );

          soundRef.current = sound;
          setIsPlaying(true);
          setIsLoading(false);
        };

        reader.onerror = () => {
          console.error('Erro ao converter áudio');
          setIsLoading(false);
        };
      } catch (error) {
        console.error('Erro ao tocar TTS:', error);
        setIsLoading(false);
        setCurrentMessageId(null);
      }
    },
    [isPlaying, currentMessageId]
  );

  const stopTTS = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setCurrentMessageId(null);
  }, []);

  return {
    playTTS,
    stopTTS,
    isPlaying,
    isLoading,
    currentMessageId,
  };
};
