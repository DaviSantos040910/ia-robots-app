// src/hooks/useAudioRecorder.ts

import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Estados possíveis da gravação de áudio
 */
export type RecordingState = 'idle' | 'recording' | 'paused';

/**
 * Hook personalizado para gerenciar gravação de áudio
 * Permite iniciar, pausar, retomar, parar e cancelar gravações
 */
export const useAudioRecorder = () => {
  // Estado da gravação (idle, recording, paused)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  
  // Duração da gravação em milissegundos
  const [duration, setDuration] = useState<number>(0);
  
  // Referência ao objeto de gravação do expo-av
  const recordingRef = useRef<Audio.Recording | null>(null);
  
  // Timer para atualizar a duração
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Inicia a gravação de áudio
   * Solicita permissões e configura o modo de áudio
   */
  const startRecording = async (): Promise<boolean> => {
    try {
      console.log('[AudioRecorder] Solicitando permissões...');
      
      // Solicita permissão de gravação
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        console.warn('[AudioRecorder] Permissão de gravação negada');
        return false;
      }

      // Configura o modo de áudio para gravação
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('[AudioRecorder] Iniciando gravação...');
      
      // Cria uma nova instância de gravação com configurações otimizadas
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setRecordingState('recording');
      setDuration(0);

      // Inicia timer para atualizar duração
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 100);
      }, 100);

      console.log('[AudioRecorder] Gravação iniciada com sucesso');
      return true;
    } catch (err) {
      console.error('[AudioRecorder] Erro ao iniciar gravação:', err);
      return false;
    }
  };

  /**
   * Pausa a gravação atual
   */
  const pauseRecording = async (): Promise<void> => {
    try {
      if (!recordingRef.current) {
        console.warn('[AudioRecorder] Nenhuma gravação ativa para pausar');
        return;
      }

      console.log('[AudioRecorder] Pausando gravação...');
      await recordingRef.current.pauseAsync();
      setRecordingState('paused');

      // Para o timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      console.log('[AudioRecorder] Gravação pausada');
    } catch (err) {
      console.error('[AudioRecorder] Erro ao pausar gravação:', err);
    }
  };

  /**
   * Retoma uma gravação pausada
   */
  const resumeRecording = async (): Promise<void> => {
    try {
      if (!recordingRef.current) {
        console.warn('[AudioRecorder] Nenhuma gravação ativa para retomar');
        return;
      }

      console.log('[AudioRecorder] Retomando gravação...');
      await recordingRef.current.startAsync();
      setRecordingState('recording');

      // Reinicia o timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 100);
      }, 100);

      console.log('[AudioRecorder] Gravação retomada');
    } catch (err) {
      console.error('[AudioRecorder] Erro ao retomar gravação:', err);
    }
  };

  /**
   * Para a gravação e retorna o URI do arquivo de áudio
   */
  const stopRecording = async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) {
        console.warn('[AudioRecorder] Nenhuma gravação ativa para parar');
        return null;
      }

      console.log('[AudioRecorder] Parando gravação...');
      
      // Para o timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Para a gravação e obtém o status
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recordingRef.current.getURI();
      console.log('[AudioRecorder] Gravação finalizada. URI:', uri);

      // Reseta o estado
      recordingRef.current = null;
      setRecordingState('idle');
      setDuration(0);

      return uri;
    } catch (err) {
      console.error('[AudioRecorder] Erro ao parar gravação:', err);
      return null;
    }
  };

  /**
   * Cancela a gravação atual sem salvar
   */
  const cancelRecording = async (): Promise<void> => {
    try {
      console.log('[AudioRecorder] Cancelando gravação...');

      // Para o timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Para e descarta a gravação
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
        recordingRef.current = null;
      }

      // Reseta o estado
      setRecordingState('idle');
      setDuration(0);

      console.log('[AudioRecorder] Gravação cancelada');
    } catch (err) {
      console.error('[AudioRecorder] Erro ao cancelar gravação:', err);
    }
  };

  /**
   * Formata a duração em formato mm:ss
   */
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
