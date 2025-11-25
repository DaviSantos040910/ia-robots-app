import { useState, useRef, useCallback, useEffect } from 'react';
import { Vibration, Alert } from 'react-native'; // Adicionado Alert
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next'; // Adicionado i18n
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useTTS } from '../../../hooks/useTTS';
import { chatService } from '../../../services/chatService';

export type VoiceCallState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'PLAYING';

type UseVoiceCallLogicProps = {
  chatId: string;
  onError?: (error: string) => void;
};

export const useVoiceCallLogic = ({ chatId, onError }: UseVoiceCallLogicProps) => {
  const { t } = useTranslation();
  const [callState, setCallState] = useState<VoiceCallState>('IDLE');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { startRecording, stopRecording, cancelRecording: cancelAudioRecorder, duration } = useAudioRecorder();
  const { playTTS, stopTTS, isPlaying: isTTSPlaying, isLoading: isTTSLoading } = useTTS();

  useEffect(() => {
    return () => { cancelInteraction(); };
  }, []);

  useEffect(() => {
    if (callState === 'PLAYING' && !isTTSPlaying && !isTTSLoading) {
      setCallState('IDLE');
      setFeedbackText('');
    }
  }, [callState, isTTSPlaying, isTTSLoading]);

  const startRecordingInCall = useCallback(async () => {
    try {
      if (isTTSPlaying || isTTSLoading) {
        await stopTTS();
      }
      setCallState('RECORDING');
      setFeedbackText('');
      const success = await startRecording();
      if (!success) {
        setCallState('IDLE');
        if (onError) onError(t('voiceCall.errors.permission'));
      } else {
        Vibration.vibrate(50);
      }
    } catch (error) {
      console.error('[VoiceLogic] Erro ao iniciar:', error);
      setCallState('IDLE');
    }
  }, [isTTSPlaying, isTTSLoading, stopTTS, startRecording, onError, t]);

  const stopRecordingAndSend = useCallback(async () => {
    if (callState !== 'RECORDING') return;

    try {
      const audioUri = await stopRecording();
      // Usamos a duration do hook, que é atualizada enquanto grava
      const finalDuration = duration; 

      Vibration.vibrate(50);

      if (!audioUri) {
        setCallState('IDLE');
        return;
      }

      // --- VALIDAÇÃO DE SEGURANÇA 1: Duração Mínima ---
      if (finalDuration < 1000) { // Menos de 1 segundo
        console.warn('[VoiceLogic] Áudio muito curto (< 1s). Descartando.');
        setCallState('IDLE');
        // Opcional: Feedback sutil
        // if (onError) onError("Fale por mais tempo.");
        return;
      }

      // --- VALIDAÇÃO DE SEGURANÇA 2: Tamanho do Arquivo ---
      try {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists || fileInfo.size === 0) {
            console.warn('[VoiceLogic] Arquivo de áudio vazio ou inexistente.');
            setCallState('IDLE');
            if (onError) onError(t('voiceCall.errors.emptyAudio'));
            return;
        }
      } catch (fsError) {
          console.warn('[VoiceLogic] Falha ao verificar arquivo (continuando):', fsError);
      }

      setCallState('PROCESSING');
      abortControllerRef.current = new AbortController();
      
      const response = await chatService.sendVoiceInteraction(
        chatId, 
        audioUri, 
        { signal: abortControllerRef.current.signal }
      );

      setFeedbackText(response.transcription);

      if (response.ai_messages && response.ai_messages.length > 0) {
        const lastMessage = response.ai_messages[response.ai_messages.length - 1];
        if (lastMessage.content) {
          setCallState('PLAYING');
          await playTTS(chatId, lastMessage.id);
        } else {
          setCallState('IDLE');
        }
      } else {
         setCallState('IDLE');
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[VoiceLogic] Cancelada.');
      } else {
        console.error('[VoiceLogic] Erro:', error);
        Vibration.vibrate([0, 50, 100, 50]); 
        if (onError) onError(t('voiceCall.errors.processing'));
      }
      setCallState('IDLE');
      setFeedbackText('');
    } finally {
      abortControllerRef.current = null;
    }
  }, [callState, stopRecording, duration, chatId, onError, playTTS, t]);

  const cancelInteraction = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    await cancelAudioRecorder();
    await stopTTS();
    setCallState('IDLE');
    setFeedbackText('');
  }, [cancelAudioRecorder, stopTTS]);

  return {
    callState,
    startRecordingInCall,
    stopRecordingAndSend,
    cancelInteraction,
    feedbackText, 
    isBotSpeaking: isTTSPlaying, 
  };
};