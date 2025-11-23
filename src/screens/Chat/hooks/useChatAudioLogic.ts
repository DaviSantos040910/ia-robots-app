import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
// Removemos a dependência direta do chatService aqui para usar a função injetada

type UseChatAudioLogicProps = {
  // Removemos chatId e setTextInput, agora recebemos a função de envio direto
  onSendVoice: (uri: string, duration: number) => Promise<void>;
};

export const useChatAudioLogic = ({ onSendVoice }: UseChatAudioLogicProps) => {
  const { t } = useTranslation();
  // isTranscribing não é mais necessário aqui pois o loading é tratado pelo ChatProvider (isTyping)
  
  const audioRecorder = useAudioRecorder();

  // Handlers memoizados via useCallback
  const handleStartRecording = useCallback(async () => {
    const success = await audioRecorder.startRecording();
    if (!success) {
      Alert.alert(
        t('error', { defaultValue: 'Erro' }),
        t('chat.recordingPermissionDenied', { defaultValue: 'É necessária permissão do microfone para gravar áudio.' })
      );
    }
  }, [audioRecorder, t]);

  const handleStopRecording = useCallback(async () => {
    // Para a gravação
    const audioUri = await audioRecorder.stopRecording();
    const duration = audioRecorder.duration; // Pega a duração final

    if (!audioUri) {
      // Se cancelou ou deu erro silencioso
      return;
    }

    // Chama a função injetada (que fará o optimistic UI e envio)
    try {
      await onSendVoice(audioUri, duration);
    } catch (error) {
      // O tratamento de erro principal já deve ser feito no Provider/Service, 
      // mas aqui pegamos falhas residuais.
      console.error('[useChatAudioLogic] Send failed', error);
      Alert.alert(t('error'), t('chat.sendError'));
    }
  }, [audioRecorder, onSendVoice, t]);

  const audioProps = useMemo(() => ({
    recordingState: audioRecorder.recordingState,
    recordingDuration: audioRecorder.formattedDuration,
    onMic: handleStartRecording,
    onPauseRecording: audioRecorder.pauseRecording,
    onResumeRecording: audioRecorder.resumeRecording,
    onStopRecording: handleStopRecording,
    onCancelRecording: audioRecorder.cancelRecording,
    isTranscribing: false, // Campo mantido por compatibilidade com componente UI, mas sempre falso agora
  }), [
    audioRecorder.recordingState,
    audioRecorder.formattedDuration,
    audioRecorder.pauseRecording,
    audioRecorder.resumeRecording,
    audioRecorder.cancelRecording,
    handleStartRecording,
    handleStopRecording,
  ]);

  return {
    audioProps,
    recordingState: audioRecorder.recordingState,
  };
};