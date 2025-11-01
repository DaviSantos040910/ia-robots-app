// src/components/chat/ChatInput.tsx
import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View, LayoutChangeEvent, Platform, NativeSyntheticEvent, TextInputContentSizeChangeEventData } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  onMic: () => void;
  onPlus: () => void;
  onHeightChange?: (h: number) => void; // opcional
};

// CORREÇÃO: Adicionado um `default` para evitar que o valor seja `undefined` em outras plataformas.
const LINE_HEIGHT = Platform.select({ ios: 20, android: 22, default: 20 });
const MAX_LINES = 5;
const MIN_LINES = 1;
const MAX_INPUT_HEIGHT = LINE_HEIGHT * MAX_LINES;
const MIN_INPUT_HEIGHT = LINE_HEIGHT * MIN_LINES;

export const ChatInput: React.FC<Props> = ({ value, onChangeText, onSend, onMic, onPlus, onHeightChange }) => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const [contentHeight, setContentHeight] = useState<number>(MIN_INPUT_HEIGHT);

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

  return (
    <View style={s.inputWrap} onLayout={handleLayout}>
      <View style={s.inputContainer}>
        <Pressable onPress={onPlus} hitSlop={8} accessibilityLabel="Mais ações">
            <Feather name="plus" size={24} color={theme.textSecondary} />
        </Pressable>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t('chat.inputPlaceholder')}
          placeholderTextColor={theme.placeholder}
          style={[s.textInput, { height: inputHeight }]}
          multiline
          scrollEnabled={enableScroll}
          onContentSizeChange={onContentSizeChange}
          textAlignVertical="top"
          returnKeyType="default"
          blurOnSubmit={false}
        />
        <View style={s.inputIcons}>
          {canSend ? (
            <Pressable onPress={onSend} style={{ padding: 8 }} hitSlop={8} accessibilityLabel="Enviar mensagem">
              <Feather name="send" size={22} color={theme.brand.normal} />
            </Pressable>
          ) : (
            <Pressable onPress={onMic} style={{ padding: 8 }} hitSlop={8} accessibilityLabel="Gravar áudio">
              <Feather name="mic" size={22} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};