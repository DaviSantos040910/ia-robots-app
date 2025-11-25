import { useState, useRef, useCallback, useEffect } from 'react';
import { Vibration } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy'; // IMPORTANTE para validar tamanho
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useTTS } from '../../../hooks/useTTS';
import { chatService } from '../../../services/chatService';

export type VoiceCallState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'PLAYING';

type UseVoiceCallLogicProps = {
  chatId: string;
  onError?: (error: string) => void;
};

export const useVoiceCallLogic = ({ chatId, onError }: UseVoiceCallLogicProps) => {
  const [callState, setCallState] = useState<VoiceCallState>('IDLE');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { startRecording, stopRecording, cancelRecording: cancelAudioRecorder } = useAudioRecorder();
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
        if (onError) onError('Permissão de microfone negada.');
      } else {
        Vibration.vibrate(50);
      }
    } catch (error) {
      console.error('[VoiceLogic] Erro ao iniciar:', error);
      setCallState('IDLE');
    }
  }, [isTTSPlaying, isTTSLoading, stopTTS, startRecording, onError]);

  const stopRecordingAndSend = useCallback(async () => {
    if (callState !== 'RECORDING') return;

    try {
      const audioUri = await stopRecording();
      Vibration.vibrate(50);

      if (!audioUri) {
        setCallState('IDLE');
        return;
      }

      // --- VALIDAÇÃO DE TAMANHO DO ARQUIVO ---
      try {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists || fileInfo.size === 0) {
            console.warn('[VoiceLogic] Áudio vazio detectado.');
            setCallState('IDLE');
            // Não enviamos erro para o usuário pois pode ser um toque acidental rápido
            return;
        }
      } catch (fsError) {
          console.warn('[VoiceLogic] Falha ao verificar arquivo:', fsError);
          // Continua, pois o erro de FS não deve bloquear o app se o arquivo existir
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
        if (onError) onError('Não entendi. Tente novamente.');
      }
      setCallState('IDLE');
      setFeedbackText('');
    } finally {
      abortControllerRef.current = null;
    }
  }, [callState, stopRecording, chatId, onError, playTTS]);

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