// src/components/chat/ChatInput.tsx

import React, { useEffect, useState } from 'react';
import { 
  Pressable, 
  TextInput, 
  View, 
  LayoutChangeEvent, 
  Platform, 
  NativeSyntheticEvent, 
  TextInputContentSizeChangeEventData,
  ActivityIndicator,
  Text
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RecordingState } from '../../hooks/useAudioRecorder';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { Colors } from '../../theme/colors';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  onMic: () => void;
  onPlus: () => void;
  onHeightChange?: (h: number) => void;
  // Novas props para gravação
  recordingState: RecordingState;
  recordingDuration: string;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  isTranscribing?: boolean;
};

const LINE_HEIGHT = Platform.select({ ios: 22, android: 24, default: 22 });
const MAX_LINES = 5;
const MIN_LINES = 1;
const MAX_INPUT_HEIGHT = LINE_HEIGHT * MAX_LINES;
const MIN_INPUT_HEIGHT = LINE_HEIGHT * MIN_LINES;

export const ChatInput: React.FC<Props> = ({ 
  value, 
  onChangeText, 
  onSend, 
  onMic, 
  onPlus, 
  onHeightChange,
  recordingState,
  recordingDuration,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onCancelRecording,
  isTranscribing = false
}) => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const [contentHeight, setContentHeight] = useState(MIN_INPUT_HEIGHT);

  useEffect(() => {
    if (!value?.trim()) {
      setContentHeight(MIN_INPUT_HEIGHT);
    }
  }, [value]);

  const handleLayout = (e: LayoutChangeEvent) => {
    onHeightChange?.(e.nativeEvent.layout.height);
  };

  const onContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const h = e.nativeEvent.contentSize?.height || MIN_INPUT_HEIGHT;
    setContentHeight(h);
  };

  const canSend = value.trim().length > 0;
  const inputHeight = Math.min(MAX_INPUT_HEIGHT, Math.max(MIN_INPUT_HEIGHT, contentHeight));
  const enableScroll = contentHeight > MAX_INPUT_HEIGHT;

  // Se estiver transcrevendo, mostra indicador de carregamento
  if (isTranscribing) {
    return (
      <View style={s.inputWrap} onLayout={handleLayout}>
        <View style={s.recordingContainer}>
          <ActivityIndicator size="small" color={theme.brand.normal} />
          <Text style={s.recordingText}>
            {t('chat.transcribing', { defaultValue: 'Transcrevendo áudio...' })}
          </Text>
        </View>
      </View>
    );
  }

  // Se estiver gravando, mostra UI de gravação
  if (recordingState !== 'idle') {
    return (
      <View style={s.inputWrap} onLayout={handleLayout}>
        <View style={s.recordingContainer}>
          {/* Botão de cancelar */}
          <Pressable onPress={onCancelRecording} style={s.recordingButton}>
            <Feather name="x" size={24} color={Colors.semantic.error.normal} />
          </Pressable>

          {/* Indicador visual de gravação */}
          <View style={s.recordingIndicator}>
            <View style={[
              s.recordingDot,
              recordingState === 'recording' && s.recordingDotActive
            ]} />
            <Text style={s.recordingDuration}>{recordingDuration}</Text>
          </View>

          {/* Botão de pausar/retomar */}
          <Pressable 
            onPress={recordingState === 'recording' ? onPauseRecording : onResumeRecording} 
            style={s.recordingButton}
          >
            <Feather 
              name={recordingState === 'recording' ? 'pause' : 'play'} 
              size={24} 
              color={theme.brand.normal} 
            />
          </Pressable>

          {/* Botão de parar e enviar */}
          <Pressable onPress={onStopRecording} style={s.recordingButton}>
            <Feather name="check" size={24} color={Colors.semantic.success.normal} />
          </Pressable>
        </View>
      </View>
    );
  }

  // UI normal do chat input
  return (
    <View style={s.inputWrap} onLayout={handleLayout}>
      <View style={s.inputContainer}>
        <Pressable onPress={onPlus}>
          <Feather name="plus" size={24} color={theme.textSecondary} />
        </Pressable>

        <TextInput
          style={[
            s.textInput,
            { height: inputHeight }
          ]}
          placeholder={t('chat.typeMessage', { defaultValue: 'Send message...' })}
          placeholderTextColor={theme.placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline
          scrollEnabled={enableScroll}
          onContentSizeChange={onContentSizeChange}
          textAlignVertical="center"
        />

        {canSend ? (
          <Pressable onPress={onSend}>
            <Feather name="send" size={24} color={theme.brand.normal} />
          </Pressable>
        ) : (
          <Pressable onPress={onMic}>
            <Feather name="mic" size={24} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
};
