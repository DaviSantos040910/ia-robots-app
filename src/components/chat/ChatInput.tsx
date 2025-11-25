// src/components/chat/ChatInput.tsx

import React, { useEffect, useState, memo } from 'react';
import { 
  Pressable, 
  TextInput, 
  View, 
  LayoutChangeEvent, 
  Platform, 
  NativeSyntheticEvent, 
  TextInputContentSizeChangeEventData,
  ActivityIndicator,
  Text,
  StyleSheet // Importado para uso local se necessário
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

const ChatInputComponent: React.FC<Props> = ({ 
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

  // Estado de Transcrição
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

  // Estado de Gravação
  if (recordingState !== 'idle') {
    return (
      <View style={s.inputWrap} onLayout={handleLayout}>
        <View style={s.recordingContainer}>
          {/* Botão CANCELAR (Lixeira ou X) - Vermelho para perigo */}
          <Pressable 
            onPress={onCancelRecording} 
            style={({ pressed }) => [
              s.recordingButton, 
              { opacity: pressed ? 0.6 : 1 }
            ]}
            accessibilityLabel={t('common.cancel')}
            accessibilityRole="button"
          >
            <Feather name="trash-2" size={24} color={Colors.semantic.error.normal} />
          </Pressable>

          <View style={s.recordingIndicator}>
            {/* Dot pulsante ou fixo indicando gravação ativa */}
            <View style={[
              s.recordingDot,
              // Quando gravando, usa vermelho. Quando pausado, usa cor neutra ou mantém vermelho fixo.
              { backgroundColor: recordingState === 'recording' ? Colors.semantic.error.normal : theme.textSecondary },
              recordingState === 'recording' && s.recordingDotActive
            ]} />
            <Text style={s.recordingDuration}>{recordingDuration}</Text>
          </View>

          {/* Botão PAUSE/RESUME - Cor neutra/marca */}
          {/* Opcional: Remover se quiser simplificar a UI de gravação como o WhatsApp */}
          <Pressable 
            onPress={recordingState === 'recording' ? onPauseRecording : onResumeRecording} 
            style={({ pressed }) => [
              s.recordingButton, 
              { opacity: pressed ? 0.6 : 1 }
            ]}
          >
            <Feather 
              name={recordingState === 'recording' ? 'pause' : 'mic'} 
              size={24} 
              color={theme.textPrimary} 
            />
          </Pressable>

          {/* Botão ENVIAR (Check/Seta) - Cor da marca para ação positiva */}
          <Pressable 
            onPress={onStopRecording} 
            style={({ pressed }) => [
              s.recordingButton, 
              // Fundo arredondado ou cor de destaque para o botão principal
              { 
                backgroundColor: theme.brand.normal, 
                borderRadius: 20, 
                padding: 8, // Aumenta a área visual
                marginLeft: 8,
                opacity: pressed ? 0.8 : 1
              }
            ]}
            accessibilityLabel={t('common.send')}
            accessibilityRole="button"
          >
            <Feather name="arrow-up" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  // UI Padrão
  return (
    <View style={s.inputWrap} onLayout={handleLayout}>
      <View style={s.inputContainer}>
        <Pressable onPress={onPlus} hitSlop={10} style={{ padding: 4 }}>
          <Feather name="plus" size={24} color={theme.textSecondary} />
        </Pressable>

        <TextInput
          style={[
            s.textInput,
            { height: inputHeight }
          ]}
          placeholder={t('chat.inputPlaceholder', { defaultValue: 'Send message...' })}
          placeholderTextColor={theme.placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline
          scrollEnabled={enableScroll}
          onContentSizeChange={onContentSizeChange}
          textAlignVertical="center"
        />

        {canSend ? (
          <Pressable onPress={onSend} hitSlop={10} style={{ padding: 4 }}>
            <Feather name="send" size={24} color={theme.brand.normal} />
          </Pressable>
        ) : (
          <Pressable 
            onPress={onMic} 
            hitSlop={10}
            style={({ pressed }) => ({ 
                padding: 4,
                opacity: pressed ? 0.6 : 1 
            })}
            accessibilityLabel="Gravar mensagem de voz"
            accessibilityRole="button"
          >
            {/* Ícone de microfone com cor primária quando ocioso para indicar interatividade */}
            <Feather name="mic" size={24} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export const ChatInput = memo(ChatInputComponent);