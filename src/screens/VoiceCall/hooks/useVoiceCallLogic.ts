import { useReducer, useRef, useCallback, useEffect } from 'react';
import { Vibration, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
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
      return { ...state, status: 'RECORDING', errorMessage: undefined, transcription: '' };

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
      return { ...initialState };

    case 'SET_ERROR':
      return { ...state, status: 'IDLE', errorMessage: action.message };

    default:
      return state;
  }
}

// --- 3. Função Utilitária de Áudio (Global ao arquivo) ---
const configureAudioSession = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false, // GARANTE O SPEAKER
    });
  } catch (error) {
    console.error('[VoiceLogic] Failed to set audio mode:', error);
  }
};

// --- 4. Hook Principal ---

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

  // Helper de Feedback Tátil
  const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(style);
      } catch (e) {
        Vibration.vibrate(50);
      }
    }
  };

  // --- Barge-in Logic ---
  const cancelCurrentInteraction = useCallback(async () => {
    console.log('[VoiceLogic] Barge-in: Cancelando interação atual...');
    
    // 1. Para TTS
    await stopTTS();

    // 2. Aborta API
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 3. Prepara novo controller
    abortControllerRef.current = new AbortController();
  }, [stopTTS]);

  // --- Efeitos ---

  useEffect(() => {
    configureAudioSession(); // Configura na montagem
    return () => {
      // Limpeza na desmontagem
      if (abortControllerRef.current) abortControllerRef.current.abort();
      stopTTS();
      cancelAudioRecorder();
    };
  }, []);

  useEffect(() => {
    if (state.status === 'SPEAKING' && !isTTSPlaying && !isTTSLoading) {
      dispatch({ type: 'FINISH_SPEAKING' });
    }
  }, [state.status, isTTSPlaying, isTTSLoading]);

  // --- Ações ---

  const startRecordingInCall = useCallback(async () => {
    // 1. Configura modo de áudio (Crítico para evitar Permission Denied no Android ao alternar)
    await configureAudioSession();

    // 2. Interrompe qualquer coisa acontecendo
    await cancelCurrentInteraction();

    // 3. Feedback Tátil e Visual
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: 'START_RECORDING' });

    // 4. Inicia Hardware
    try {
      const success = await startRecording();
      if (!success) {
        const errorMsg = t('voiceCall.errors.permission');
        if (onError) onError(errorMsg);
        dispatch({ type: 'SET_ERROR', message: errorMsg });
      }
    } catch (error) {
      console.error('[VoiceLogic] Erro ao iniciar hardware:', error);
      dispatch({ type: 'SET_ERROR', message: 'Erro de hardware' });
    }
  }, [cancelCurrentInteraction, startRecording, onError, t]);

  const stopRecordingAndSend = useCallback(async () => {
    if (state.status !== 'RECORDING') return;

    try {
      const audioUri = await stopRecording();
      
      // --- Tratamento de Clique Rápido (Quick Click) ---
      // Se audioUri for null, o hook useAudioRecorder já limpou tudo.
      // Apenas resetamos o estado visual para IDLE silenciosamente.
      if (!audioUri) {
        console.warn('[VoiceLogic] Gravação descartada (curta ou inválida).');
        dispatch({ type: 'INTERRUPT' }); 
        return;
      }

      // Verificação extra de arquivo vazio
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists || fileInfo.size <= 1024) {
         console.warn('[VoiceLogic] Arquivo vazio.');
         dispatch({ type: 'INTERRUPT' });
         return;
      }

      // Feedback de envio
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      dispatch({ type: 'STOP_RECORDING_AND_SEND' });

      // Envio API
      if (!abortControllerRef.current) abortControllerRef.current = new AbortController();

      const response = await chatService.sendVoiceInteraction(
        chatId, 
        audioUri, 
        { signal: abortControllerRef.current.signal }
      );

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
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('[VoiceLogic] Request cancelado (Barge-in).');
        return; // Ignora silenciosamente
      }

      console.error('[VoiceLogic] Erro processamento:', error);
      
      if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => Vibration.vibrate([0, 50, 100, 50]));
      }
      
      const errorMsg = t('voiceCall.errors.processing');
      if (onError) onError(errorMsg);
      dispatch({ type: 'SET_ERROR', message: errorMsg });
    } finally {
      abortControllerRef.current = null;
    }
  }, [state.status, stopRecording, chatId, playTTS, t, onError]);

  const cancelInteraction = useCallback(async () => {
    // Ação manual de cancelamento (ex: botão voltar)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    await Promise.all([
      cancelAudioRecorder(),
      stopTTS()
    ]);

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