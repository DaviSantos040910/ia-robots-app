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
      const audioUri = await audioRecorder.stopRecording();
      const duration = audioRecorder.duration;

      if (!audioUri) return;

      // Validação Global Silenciosa
      if (duration < 500) {
        console.log('[useChatAudioLogic] Áudio muito curto (< 500ms). Descartando silenciosamente.');
        return;
      }

      await onSendVoice(audioUri, duration);

    } catch (error) {
      console.error('[useChatAudioLogic] Send failed', error);
      Alert.alert(
        t('common.ops'), 
        t('chat.audioSendError', { defaultValue: 'Falha ao enviar áudio. Tente novamente.' })
      );
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