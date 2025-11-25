import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';

type UseChatAudioLogicProps = {
  onSendVoice: (uri: string, duration: number) => Promise<void>;
};

export const useChatAudioLogic = ({ onSendVoice }: UseChatAudioLogicProps) => {
  const { t } = useTranslation();
  const audioRecorder = useAudioRecorder();

  const handleStartRecording = useCallback(async () => {
    try {
      const success = await audioRecorder.startRecording();
      if (!success) {
        Alert.alert(
          t('common.error'),
          t('chat.recordingPermissionDenied', { defaultValue: 'Permissão de microfone negada.' })
        );
      }
    } catch (error) {
      console.error('[useChatAudioLogic] Start failed', error);
      Alert.alert(t('common.error'), t('chat.recordingFailed', { defaultValue: 'Falha ao iniciar gravação.' }));
    }
  }, [audioRecorder, t]);

  const handleStopRecording = useCallback(async () => {
    try {
      // 1. Para a gravação e obtém URI
      const audioUri = await audioRecorder.stopRecording();
      const duration = audioRecorder.duration;

      // 2. Validação Básica
      if (!audioUri) {
        // Gravação cancelada ou erro interno silencioso do expo-av
        return;
      }

      if (duration < 1000) {
        // UX: Áudios muito curtos (cliques acidentais) são descartados silenciosamente ou com aviso
        // Optamos por descartar silenciosamente para não irritar em cliques rápidos, 
        // mas você pode descomentar o Alert abaixo.
        // Alert.alert(t('common.ops'), t('chat.audioTooShort', { defaultValue: 'Áudio muito curto.' }));
        return;
      }

      // 3. Envio com Tratamento de Erro
      await onSendVoice(audioUri, duration);

    } catch (error) {
      console.error('[useChatAudioLogic] Send failed', error);
      
      // UX: Feedback explícito para o usuário
      Alert.alert(
        t('common.ops'), 
        t('chat.audioSendError', { defaultValue: 'Falha ao enviar áudio. Tente novamente.' })
      );
      
      // Nota: O hook useChatSender (quem injeta onSendVoice) é responsável por
      // reverter a UI otimista (remover o balão ou marcar como erro).
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
    isTranscribing: false,
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