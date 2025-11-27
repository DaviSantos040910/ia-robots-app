import { useReducer, useRef, useCallback, useEffect } from 'react';
import { Vibration, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics'; // Importando Haptics
import { useSharedValue } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useTTS } from '../../../hooks/useTTS';
import { chatService } from '../../../services/chatService';

// --- 1. Definição da Máquina de Estados ---

export type VoiceCallStatus = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

interface VoiceCallState {
  status: VoiceCallStatus;
  transcription: string; 
  errorMessage?: string;
  currentAudioId?: string;
}

type VoiceCallAction =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING_AND_SEND' }
  | { type: 'RECEIVE_RESPONSE'; transcription: string; audioId?: string }
  | { type: 'FINISH_SPEAKING' }
  | { type: 'INTERRUPT' }
  | { type: 'SET_ERROR'; message: string };

const initialState: VoiceCallState = {
  status: 'IDLE',
  transcription: '',
  errorMessage: undefined,
};

// --- 2. Reducer ---

function voiceCallReducer(state: VoiceCallState, action: VoiceCallAction): VoiceCallState {
  switch (action.type) {
    case 'START_RECORDING':
      // Permite transição de SPEAKING para RECORDING (Barge-in)
      if (['IDLE', 'SPEAKING', 'ERROR'].includes(state.status)) {
        return { ...state, status: 'RECORDING', errorMessage: undefined, transcription: '' };
      }
      return state;

    case 'STOP_RECORDING_AND_SEND':
      if (state.status === 'RECORDING') {
        return { ...state, status: 'PROCESSING' };
      }
      return state;

    case 'RECEIVE_RESPONSE':
      if (state.status === 'PROCESSING') {
        const nextStatus = action.audioId ? 'SPEAKING' : 'IDLE';
        return { 
          ...state, 
          status: nextStatus, 
          transcription: action.transcription,
          currentAudioId: action.audioId 
        };
      }
      return state;

    case 'FINISH_SPEAKING':
      if (state.status === 'SPEAKING') {
        return { ...state, status: 'IDLE', currentAudioId: undefined };
      }
      return state;

    case 'INTERRUPT':
      // Reseta estado completamente
      return { ...initialState };

    case 'SET_ERROR':
      return { ...state, status: 'IDLE', errorMessage: action.message };

    default:
      return state;
  }
}

// --- 3. Hook Principal ---

type UseVoiceCallLogicProps = {
  chatId: string;
  onError?: (error: string) => void;
};

export const useVoiceCallLogic = ({ chatId, onError }: UseVoiceCallLogicProps) => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(voiceCallReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const audioLevel = useSharedValue(-160); 

  const { 
    startRecording, 
    stopRecording, 
    cancelRecording: cancelAudioRecorder, 
    duration, 
    recordingState: recorderInternalState 
  } = useAudioRecorder(audioLevel);
  
  const { playTTS, stopTTS, isPlaying: isTTSPlaying, isLoading: isTTSLoading } = useTTS();

  // --- Audio Session Setup ---
  useEffect(() => {
    const configureAudioSession = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false, // Força saída no Speaker
        });
      } catch (error) {
        console.error('[VoiceLogic] Failed to set audio mode:', error);
      }
    };

    configureAudioSession();

    return () => {
      cancelInteraction(); // Garante limpeza ao desmontar
    };
  }, []);

  // Monitora fim da fala para voltar a IDLE
  useEffect(() => {
    if (state.status === 'SPEAKING' && !isTTSPlaying && !isTTSLoading) {
      dispatch({ type: 'FINISH_SPEAKING' });
    }
  }, [state.status, isTTSPlaying, isTTSLoading]);

  // Função auxiliar para Haptics seguro (web fallback)
  const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(style);
      } catch (e) {
        // Fallback para Vibration se Haptics falhar
        Vibration.vibrate(50);
      }
    }
  };

  const startRecordingInCall = useCallback(async () => {
    // 1. Feedback Tátil Imediato
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    // 2. Barge-in: Para qualquer fala ou carregamento anterior imediatamente
    if (state.status === 'SPEAKING' || isTTSPlaying || isTTSLoading) {
      console.log('[VoiceLogic] Barge-in detectado. Parando TTS.');
      // Aborta request de áudio pendente se houver
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      await stopTTS();
    }

    try {
      const success = await startRecording();
      
      if (success) {
        dispatch({ type: 'START_RECORDING' });
      } else {
        const errorMsg = t('voiceCall.errors.permission');
        if (onError) onError(errorMsg);
        dispatch({ type: 'SET_ERROR', message: errorMsg });
      }
    } catch (error) {
      console.error('[VoiceLogic] Erro ao iniciar hardware:', error);
      dispatch({ type: 'SET_ERROR', message: 'Erro de hardware' });
    }
  }, [isTTSPlaying, isTTSLoading, stopTTS, startRecording, onError, t, state.status]);

  const stopRecordingAndSend = useCallback(async () => {
    if (state.status !== 'RECORDING') return;

    try {
      const audioUri = await stopRecording();
      const finalDuration = duration;

      if (!audioUri || finalDuration < 500) {
        console.warn(`[VoiceLogic] Áudio inválido ou curto (${finalDuration}ms).`);
        dispatch({ type: 'INTERRUPT' }); 
        return;
      }

      // Feedback de envio
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      dispatch({ type: 'STOP_RECORDING_AND_SEND' });

      // Inicia AbortController para esta requisição
      abortControllerRef.current = new AbortController();

      const response = await chatService.sendVoiceInteraction(
        chatId, 
        audioUri, 
        { signal: abortControllerRef.current.signal }
      );

      // Feedback de Sucesso na Resposta
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

      let audioIdToPlay: string | undefined;
      if (response.ai_messages && response.ai_messages.length > 0) {
        const lastMessage = response.ai_messages[response.ai_messages.length - 1];
        if (lastMessage.content) {
          audioIdToPlay = lastMessage.id;
        }
      }

      dispatch({ 
        type: 'RECEIVE_RESPONSE', 
        transcription: response.transcription,
        audioId: audioIdToPlay 
      });

      if (audioIdToPlay) {
        await playTTS(chatId, audioIdToPlay);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[VoiceLogic] Request cancelado pelo usuário.');
        dispatch({ type: 'INTERRUPT' });
      } else {
        console.error('[VoiceLogic] Erro processamento:', error);
        // Feedback de Erro
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => Vibration.vibrate([0, 50, 100, 50]));
        }
        const errorMsg = t('voiceCall.errors.processing');
        if (onError) onError(errorMsg);
        dispatch({ type: 'SET_ERROR', message: errorMsg });
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [state.status, stopRecording, duration, chatId, playTTS, t, onError]);

  const cancelInteraction = useCallback(async () => {
    // 1. Aborta requisição de rede pendente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 2. Para hardware (Microfone e Player)
    await Promise.all([
      cancelAudioRecorder(),
      stopTTS()
    ]);

    // 3. Reseta estado visual
    dispatch({ type: 'INTERRUPT' });
  }, [cancelAudioRecorder, stopTTS]);

  return {
    callState: state.status,
    feedbackText: state.transcription,
    errorMessage: state.errorMessage,
    startRecordingInCall,
    stopRecordingAndSend,
    cancelInteraction,
    recordingState: recorderInternalState, 
    audioLevel,
  };
};