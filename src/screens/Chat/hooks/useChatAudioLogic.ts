import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { chatService } from '../../../services/chatService';

type UseChatAudioLogicProps = {
  chatId: string | null;
  setTextInput: (text: string) => void; // Função para atualizar o estado do input na tela
};

export const useChatAudioLogic = ({ chatId, setTextInput }: UseChatAudioLogicProps) => {
  const { t } = useTranslation();
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Usa o hook global de gravação
  const audioRecorder = useAudioRecorder();

  // Inicia a gravação com verificação de permissão
  const handleStartRecording = useCallback(async () => {
    const success = await audioRecorder.startRecording();
    if (!success) {
      Alert.alert(
        t('error', { defaultValue: 'Erro' }),
        t('chat.recordingPermissionDenied', { defaultValue: 'É necessária permissão do microfone para gravar áudio.' })
      );
    }
  }, [audioRecorder, t]);

  // Para a gravação e inicia o fluxo de transcrição
  const handleStopRecording = useCallback(async () => {
    if (!chatId) return;

    // 1. Para a gravação e pega o arquivo
    const audioUri = await audioRecorder.stopRecording();

    if (!audioUri) {
      Alert.alert(t('error', { defaultValue: 'Erro' }), t('chat.recordingFailed', { defaultValue: 'Falha ao salvar gravação.' }));
      return;
    }

    // 2. Inicia transcrição
    setIsTranscribing(true);
    try {
      const transcription = await chatService.transcribeAudio(chatId, audioUri);
      
      // 3. Injeta o texto no input
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

  // Retorna um objeto pronto para ser espalhado {...audioProps} no componente ChatInput
  return {
    audioProps: {
      recordingState: audioRecorder.recordingState,
      recordingDuration: audioRecorder.formattedDuration,
      onMic: handleStartRecording, // O botão de mic inicia a gravação
      onPauseRecording: audioRecorder.pauseRecording,
      onResumeRecording: audioRecorder.resumeRecording,
      onStopRecording: handleStopRecording, // Parar dispara a transcrição
      onCancelRecording: audioRecorder.cancelRecording,
      isTranscribing,
    },
    // Exportamos também individualmente caso a tela precise acessar o estado fora do input
    isTranscribing,
    recordingState: audioRecorder.recordingState,
  };
};