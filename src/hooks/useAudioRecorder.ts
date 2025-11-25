// src/hooks/useAudioRecorder.ts

import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

export type RecordingState = 'idle' | 'initializing' | 'recording' | 'paused' | 'stopping';

export const useAudioRecorder = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState<number>(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    return () => {
      cleanUp();
    };
  }, []);

  const cleanUp = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (recordingRef.current) {
      try {
        recordingRef.current.stopAndUnloadAsync();
      } catch (error) {
        console.warn('[AudioRecorder] Aviso: Erro ao limpar gravação no unmount (ignorado):', error);
      }
      recordingRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (isInitializingRef.current) {
        console.warn('[AudioRecorder] Bloqueio: Já existe uma inicialização em andamento.');
        return false;
    }

    isInitializingRef.current = true;
    setRecordingState('initializing'); 

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.warn('[AudioRecorder] Permissão de áudio negada.');
        setRecordingState('idle');
        isInitializingRef.current = false;
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
      isInitializingRef.current = false;

      // --- FASE 3.1: Timer Otimizado (500ms) ---
      // Atualiza a cada 500ms para reduzir re-renders.
      // A precisão visual de segundos é mantida.
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 500);
      }, 500);

      return true;
    } catch (err) {
      console.error('[AudioRecorder] Erro fatal ao iniciar:', err);
      setRecordingState('idle');
      isInitializingRef.current = false;
      if (recordingRef.current) {
          try { await recordingRef.current.stopAndUnloadAsync(); } catch(e) {}
          recordingRef.current = null;
      }
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
      // Reinicia timer com intervalo otimizado
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 500);
      }, 500);
    } catch (err) {
      console.error('[AudioRecorder] Erro ao retomar:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (isInitializingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (!recordingRef.current) {
        setRecordingState('idle');
        setDuration(0);
        return null;
    }

    setRecordingState('stopping');

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const status = await recordingRef.current.getStatusAsync();
      // Mantemos 100ms como guard hard-limit técnico, mas a lógica de negócio usará 500ms depois
      if (status.isRecording && status.durationMillis < 100) {
          await recordingRef.current.stopAndUnloadAsync();
          recordingRef.current = null;
          setRecordingState('idle');
          setDuration(0);
          return null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); 

      recordingRef.current = null;
      setRecordingState('idle');
      setDuration(0);

      return uri;

    } catch (err) {
      console.error('[AudioRecorder] Erro no stopRecording:', err);
      try {
          if (recordingRef.current) {
              await recordingRef.current.stopAndUnloadAsync();
          }
      } catch (cleanupErr) {}
      
      recordingRef.current = null;
      setRecordingState('idle');
      setDuration(0);
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
      setRecordingState('idle');
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