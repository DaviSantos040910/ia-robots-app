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
    // --- 1. Cleanup Prévio Agressivo (Safety First) ---
    // Garante que nunca tentaremos criar uma nova gravação se uma antiga ficou pendurada.
    if (recordingRef.current) {
      console.log('[AudioRecorder] Limpando instância anterior antes de iniciar...');
      try { await recordingRef.current.stopAndUnloadAsync(); } catch(e) {}
      recordingRef.current = null;
    }

    if (isInitializingRef.current) {
        console.warn('[AudioRecorder] Bloqueio: Já existe uma inicialização em andamento.');
        return false;
    }

    isInitializingRef.current = true;
    setRecordingState('initializing'); 

    try {
      // --- 2. Permissões dentro do bloco Try/Catch ---
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
          if (status.isRecording && meteringSharedValue) {
            meteringSharedValue.value = status.metering || -160;
          }
        },
        100 
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
      
      // Cleanup extra em caso de falha na criação
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
    // Reset do medidor visual ao parar
    if (meteringSharedValue) {
        meteringSharedValue.value = -160;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // --- 3. Safety Stop Simplificado ---
    if (!recordingRef.current) {
        setRecordingState('idle');
        setDuration(0);
        return null; 
    }

    setRecordingState('stopping');

    try {
       // Verifica duração real consultando o status nativo
       const status = await recordingRef.current.getStatusAsync();
       
       // Se for muito curto (< 500ms), descartamos para evitar arquivos de áudio vazios/corrompidos
       if (status.durationMillis < 500) {
          console.log('[AudioRecorder] Gravação muito curta (<500ms). Descartando.');
          await recordingRef.current.stopAndUnloadAsync();
          recordingRef.current = null;
          
          setRecordingState('idle');
          setDuration(0);
          return null;
       }

       // Stop normal
       await recordingRef.current.stopAndUnloadAsync();
       const uri = recordingRef.current.getURI();
       
       await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); 

       recordingRef.current = null; // Zera a ref IMEDIATAMENTE após sucesso
       
       setRecordingState('idle');
       setDuration(0);

       return uri;

    } catch (error) {
       console.error('[AudioRecorder] Erro seguro no stopRecording:', error);
       
       // Tentativa final de limpeza em caso de erro
       try {
         if (recordingRef.current) {
            await recordingRef.current.stopAndUnloadAsync();
         }
       } catch (e) {}
       
       recordingRef.current = null; // Garante que a ref seja zerada
       setRecordingState('idle');
       setDuration(0);
       return null;
    }
  }, [meteringSharedValue]);

  const cancelRecording = useCallback(async (): Promise<void> => {
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
      recordingRef.current = null; // Força limpeza da ref
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