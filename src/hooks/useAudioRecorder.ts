import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { SharedValue } from 'react-native-reanimated';

export type RecordingState = 'idle' | 'initializing' | 'recording' | 'paused' | 'stopping';

// Aceita um SharedValue opcional para animação de alta performance (60fps)
export const useAudioRecorder = (meteringSharedValue?: SharedValue<number>) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState<number>(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

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

      startTimeRef.current = Date.now();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          // --- OTIMIZAÇÃO: Atualização direta do SharedValue ---
          // Isso roda a cada ~50-100ms e NÃO causa re-render do componente React
          if (status.isRecording && meteringSharedValue) {
            // status.metering varia de -160 (silêncio) a 0 (máximo)
            meteringSharedValue.value = status.metering || -160;
          }
        },
        100 // Intervalo de atualização de status (ms)
      );

      recordingRef.current = recording;
      
      setRecordingState('recording');
      setDuration(0);
      isInitializingRef.current = false;

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
  }, [meteringSharedValue]);

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

    // Reset do medidor visual ao parar
    if (meteringSharedValue) {
        meteringSharedValue.value = -160;
    }

    if (!recordingRef.current) {
        setRecordingState('idle');
        setDuration(0);
        return null;
    }

    setRecordingState('stopping');

    if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed < 500) {
            console.log(`[AudioRecorder] Gravação curta (${elapsed}ms). Aguardando buffer...`);
            await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
        }
    }

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      try {
          await recordingRef.current.stopAndUnloadAsync();
      } catch (stopError: any) {
          if (stopError.message && stopError.message.includes('no valid audio data')) {
              console.warn('[AudioRecorder] Erro conhecido: Gravação sem dados válidos.');
              recordingRef.current = null;
              setRecordingState('idle');
              setDuration(0);
              return null; 
          }
          throw stopError;
      }

      const uri = recordingRef.current.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); 

      recordingRef.current = null;
      setRecordingState('idle');
      setDuration(0);

      return uri;

    } catch (err) {
      console.error('[AudioRecorder] Erro crítico no stopRecording:', err);
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
  }, [meteringSharedValue]);

  const cancelRecording = useCallback(async (): Promise<void> => {
    // Reset do medidor visual ao cancelar
    if (meteringSharedValue) {
        meteringSharedValue.value = -160;
    }

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
  }, [meteringSharedValue]);

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