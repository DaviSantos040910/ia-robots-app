// src/hooks/useAudioRecorder.ts

import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

/**
 * Estados possíveis da gravação de áudio
 */
export type RecordingState = 'idle' | 'recording' | 'paused';

/**
 * Hook personalizado para gerenciar gravação de áudio
 * Permite iniciar, pausar, retomar, parar e cancelar gravações
 */
export const useAudioRecorder = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState<number>(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- CLEANUP FUNCTION (CORREÇÃO DE MEMORY LEAK) ---
  useEffect(() => {
    return () => {
      // Limpa o timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Para e descarrega a gravação se estiver ativa
      if (recordingRef.current) {
        try {
          recordingRef.current.stopAndUnloadAsync();
        } catch (error) {
          console.warn('Erro ao limpar gravação no unmount:', error);
        }
        recordingRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setRecordingState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 100);
      }, 100);

      return true;
    } catch (err) {
      console.error('[AudioRecorder] Erro ao iniciar:', err);
      return false;
    }
  }, []);

  const pauseRecording = useCallback(async (): Promise<void> => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.pauseAsync();
      setRecordingState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (err) {
      console.error('[AudioRecorder] Erro ao pausar:', err);
    }
  }, []);

  const resumeRecording = useCallback(async (): Promise<void> => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.startAsync();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 100);
      }, 100);
    } catch (err) {
      console.error('[AudioRecorder] Erro ao retomar:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); // Restaura modo

      const uri = recordingRef.current.getURI();
      
      // Reset completo
      recordingRef.current = null;
      setRecordingState('idle');
      setDuration(0);

      return uri;
    } catch (err) {
      console.error('[AudioRecorder] Erro ao parar:', err);
      return null;
    }
  }, []);

  const cancelRecording = useCallback(async (): Promise<void> => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      setRecordingState('idle');
      setDuration(0);
    } catch (err) {
      console.error('[AudioRecorder] Erro ao cancelar:', err);
    }
  }, []);

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    recordingState,
    duration,
    formattedDuration: formatDuration(duration),
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  };
};