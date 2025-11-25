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
  
  // Agora expomos o recordingState do hook de áudio
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

      // --- FASE 1.2: Validação de Nulo (Early Return) ---
      if (!audioUri) {
        console.warn('[VoiceLogic] Stop retornou null ou foi cancelado. Resetando para IDLE.');
        setCallState('IDLE');
        return;
      }

      // --- FASE 1.2: Validação de Duração Mínima (500ms) ---
      if (finalDuration < 500) { 
        console.warn(`[VoiceLogic] Áudio muito curto (${finalDuration}ms). Descarte silencioso.`);
        setCallState('IDLE');
        return;
      }

      // --- FASE 1.3: Validação de Arquivo (Integridade) ---
      try {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists || fileInfo.size <= 1024) { // < 1KB é provavelmente cabeçalho vazio
            console.warn(`[VoiceLogic] Arquivo inválido ou muito pequeno (${fileInfo.exists ? fileInfo.size : '0'} bytes).`);
            setCallState('IDLE');
            if (onError) onError(t('voiceCall.errors.emptyAudio'));
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
    recordingState, // --- FASE 1.2: Exposição do estado do gravador
    startRecordingInCall,
    stopRecordingAndSend,
    cancelInteraction,
    feedbackText, 
    isBotSpeaking: isTTSPlaying, 
  };
};