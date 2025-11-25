import { useState, useRef, useCallback, useEffect } from 'react';
import { Vibration, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';
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
  
  const { 
    startRecording, 
    stopRecording, 
    cancelRecording: cancelAudioRecorder, 
    duration, 
    recordingState 
  } = useAudioRecorder();
  
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
      const finalDuration = duration; 

      Vibration.vibrate(50);

      // --- CRASH FIX: Lidar com retorno nulo silenciosamente ---
      // Se stopRecording retornar null (devido a erro "no valid audio data" ou tempo curto),
      // apenas resetamos o estado para IDLE sem mostrar erro para o usuário.
      if (!audioUri) {
        console.log('[VoiceLogic] Gravação inválida ou cancelada. Resetando para IDLE.');
        setCallState('IDLE');
        return;
      }

      if (finalDuration < 500) { 
        console.warn(`[VoiceLogic] Áudio muito curto (${finalDuration}ms). Descarte silencioso.`);
        setCallState('IDLE');
        return;
      }

      try {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists || fileInfo.size <= 1024) {
            console.warn(`[VoiceLogic] Arquivo inválido ou muito pequeno (${fileInfo.exists ? fileInfo.size : '0'} bytes).`);
            setCallState('IDLE');
            // Aqui podemos optar por não mostrar erro para ser menos intrusivo em falhas de micro-áudio
            // if (onError) onError(t('voiceCall.errors.emptyAudio'));
            return;
        }
      } catch (fsError) {
          console.warn('[VoiceLogic] Falha ao verificar integridade do arquivo (ignorando):', fsError);
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
    recordingState, 
    startRecordingInCall,
    stopRecordingAndSend,
    cancelInteraction,
    feedbackText, 
    isBotSpeaking: isTTSPlaying, 
  };
};