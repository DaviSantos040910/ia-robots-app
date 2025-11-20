import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { chatService } from '../../../services/chatService';

type UseChatAudioLogicProps = {
  chatId: string | null;
  setTextInput: (text: string) => void;
};

export const useChatAudioLogic = ({ chatId, setTextInput }: UseChatAudioLogicProps) => {
  const { t } = useTranslation();
  const [isTranscribing, setIsTranscribing] = useState(false);

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
    if (!chatId) return;

    const audioUri = await audioRecorder.stopRecording();

    if (!audioUri) {
      Alert.alert(t('error', { defaultValue: 'Erro' }), t('chat.recordingFailed', { defaultValue: 'Falha ao salvar gravação.' }));
      return;
    }

    setIsTranscribing(true);
    try {
      const transcription = await chatService.transcribeAudio(chatId, audioUri);
      
      if (transcription) {
        setTextInput(transcription);
      }
    } catch (error) {
      console.error('[useChatAudioLogic] Transcription failed', error);
      Alert.alert(t('error', { defaultValue: 'Erro' }), t('chat.transcriptionFailed', { defaultValue: 'Falha ao transcrever áudio.' }));
    } finally {
      setIsTranscribing(false);
    }
  }, [audioRecorder, chatId, t, setTextInput]);

  // --- OTIMIZAÇÃO DE PERFORMANCE ---
  // Memoizamos o objeto audioProps.
  // Isso impede que o ChatInput re-renderize apenas porque o componente pai renderizou,
  // a menos que o estado da gravação mude.
  const audioProps = useMemo(() => ({
    recordingState: audioRecorder.recordingState,
    recordingDuration: audioRecorder.formattedDuration,
    onMic: handleStartRecording,
    onPauseRecording: audioRecorder.pauseRecording,
    onResumeRecording: audioRecorder.resumeRecording,
    onStopRecording: handleStopRecording,
    onCancelRecording: audioRecorder.cancelRecording,
    isTranscribing,
  }), [
    audioRecorder.recordingState,
    audioRecorder.formattedDuration,
    audioRecorder.pauseRecording,
    audioRecorder.resumeRecording,
    audioRecorder.cancelRecording,
    handleStartRecording,
    handleStopRecording,
    isTranscribing
  ]);

  return {
    audioProps,
    isTranscribing,
    recordingState: audioRecorder.recordingState,
  };
};