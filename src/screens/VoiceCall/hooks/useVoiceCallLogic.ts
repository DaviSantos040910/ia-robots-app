import { useState, useRef, useCallback, useEffect } from 'react';
import { Vibration } from 'react-native';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useTTS } from '../../../hooks/useTTS';
import { chatService } from '../../../services/chatService';

export type VoiceCallState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'PLAYING';

type UseVoiceCallLogicProps = {
  chatId: string;
  onError?: (error: string) => void;
};

export const useVoiceCallLogic = ({ chatId, onError }: UseVoiceCallLogicProps) => {
  // --- MÁQUINA DE ESTADOS ---
  const [callState, setCallState] = useState<VoiceCallState>('IDLE');
  // Texto temporário para feedback (transcrição parcial ou resposta)
  const [feedbackText, setFeedbackText] = useState<string>('');

  // --- REFS DE CONTROLE ---
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // --- INTEGRAÇÕES ---
  const { 
    startRecording, 
    stopRecording, 
    cancelRecording: cancelAudioRecorder 
  } = useAudioRecorder();

  const { 
    playTTS, 
    stopTTS, 
    isPlaying: isTTSPlaying,
    isLoading: isTTSLoading
  } = useTTS();

  // --- EFEITOS ---

  // 1. Cleanup ao desmontar
  useEffect(() => {
    return () => {
      cancelInteraction();
    };
  }, []);

  // 2. Sincronização: Quando o TTS termina, voltamos para IDLE
  useEffect(() => {
    if (callState === 'PLAYING' && !isTTSPlaying && !isTTSLoading) {
      console.log('[VoiceLogic] TTS finalizado. Voltando para IDLE.');
      setCallState('IDLE');
      setFeedbackText(''); // Limpa texto ao finalizar
    }
  }, [callState, isTTSPlaying, isTTSLoading]);

  /**
   * AÇÃO: Iniciar Gravação (User Press)
   */
  const startRecordingInCall = useCallback(async () => {
    try {
      // Barge-in: Para o TTS se estiver falando
      if (isTTSPlaying || isTTSLoading) {
        await stopTTS();
      }

      setCallState('RECORDING');
      setFeedbackText(''); // Limpa feedback anterior
      
      const success = await startRecording();
      if (!success) {
        setCallState('IDLE');
        if (onError) onError('Permissão de microfone negada.');
      } else {
        // Feedback tátil de início
        Vibration.vibrate(50);
      }
    } catch (error) {
      console.error('[VoiceLogic] Erro ao iniciar gravação:', error);
      setCallState('IDLE');
    }
  }, [isTTSPlaying, isTTSLoading, stopTTS, startRecording, onError]);

  /**
   * AÇÃO: Parar Gravação e Enviar (User Release)
   */
  const stopRecordingAndSend = useCallback(async () => {
    if (callState !== 'RECORDING') return;

    try {
      const audioUri = await stopRecording();
      // Feedback tátil de fim de gravação
      Vibration.vibrate(50);

      if (!audioUri) {
        setCallState('IDLE');
        return;
      }

      setCallState('PROCESSING');

      // Prepara cancelamento
      abortControllerRef.current = new AbortController();

      console.log('[VoiceLogic] Enviando áudio para API...');
      
      // Chamada real à API
      const response = await chatService.sendVoiceInteraction(
        chatId, 
        audioUri, 
        { signal: abortControllerRef.current.signal }
      );

      console.log('[VoiceLogic] Resposta recebida. Transcrição:', response.transcription);

      // Atualiza UI com o que o usuário disse
      setFeedbackText(response.transcription);

      // Verifica se há resposta para tocar
      if (response.ai_messages && response.ai_messages.length > 0) {
        // Pega a última mensagem (normalmente a resposta final)
        const lastMessage = response.ai_messages[response.ai_messages.length - 1];
        
        if (lastMessage.content) {
          setCallState('PLAYING');
          // Toca o áudio da resposta
          await playTTS(chatId, lastMessage.id);
        } else {
          setCallState('IDLE');
        }
      } else {
         setCallState('IDLE');
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[VoiceLogic] Requisição cancelada pelo usuário.');
      } else {
        console.error('[VoiceLogic] Erro no processamento:', error);
        // Feedback de erro
        Vibration.vibrate([0, 50, 100, 50]); 
        if (onError) onError('Não entendi. Tente novamente.');
      }
      setCallState('IDLE');
      setFeedbackText('');
    } finally {
      abortControllerRef.current = null;
    }
  }, [callState, stopRecording, chatId, onError, playTTS]);

  /**
   * AÇÃO: Cancelar Interação
   */
  const cancelInteraction = useCallback(async () => {
    console.log('[VoiceLogic] Cancelando interação...');

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
    feedbackText, // Expõe o texto para a UI mostrar o que foi entendido
    isBotSpeaking: isTTSPlaying, 
  };
};