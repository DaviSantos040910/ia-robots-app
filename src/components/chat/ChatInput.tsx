
import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View, LayoutChangeEvent, Platform, NativeSyntheticEvent, TextInputContentSizeChangeEventData } from 'react-native';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { useColorScheme } from 'react-native';

type Props = {
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  onMic: () => void;
  onPlus: () => void;
  onHeightChange?: (h: number) => void; // opcional
};

const MicIcon = () => <Text>{'🎙️'}</Text>;
const PlusIcon = () => <Text>{'＋'}</Text>;
const SendIcon = () => <Text>{'➤'}</Text>;

const LINE_HEIGHT = 22;
const MAX_LINES = 4;
const MIN_LINES = 1;
const MAX_INPUT_HEIGHT = LINE_HEIGHT * MAX_LINES;
const MIN_INPUT_HEIGHT = LINE_HEIGHT * MIN_LINES;

export const ChatInput: React.FC<Props> = ({ value, placeholder, onChangeText, onSend, onMic, onPlus, onHeightChange }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const [contentHeight, setContentHeight] = useState<number>(MIN_INPUT_HEIGHT);

  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setContentHeight(MIN_INPUT_HEIGHT);
    }
  }, [value]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    onHeightChange?.(h);
  };

  const onContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const h = e.nativeEvent.contentSize?.height || MIN_INPUT_HEIGHT;
    setContentHeight(h);
  };

  const canSend = value.trim().length > 0;
  const inputHeight = Math.min(MAX_INPUT_HEIGHT, Math.max(MIN_INPUT_HEIGHT, contentHeight));
  const enableScroll = contentHeight > MAX_INPUT_HEIGHT;

  return (
    <View style={[s.inputWrap, { backgroundColor: 'transparent' }]} onLayout={handleLayout}>
      <View style={[s.inputContainer, { backgroundColor: theme.surface, overflow: 'hidden' }] }>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          style={[s.textInput, { height: inputHeight, lineHeight: LINE_HEIGHT }]}
          multiline
          scrollEnabled={enableScroll}
          onContentSizeChange={onContentSizeChange}
          textAlignVertical={Platform.OS === 'android' ? 'top' : 'auto'}
          returnKeyType={'default'}
          blurOnSubmit={false}
        />
        <View style={s.inputIcons}>
          {canSend ? (
            <Pressable onPress={onSend} style={{ padding: 8 }} hitSlop={8} accessibilityLabel="Enviar mensagem">
              <SendIcon />
            </Pressable>
          ) : (
            <Pressable onPress={onMic} style={{ padding: 8 }} hitSlop={8} accessibilityLabel="Gravar áudio">
              <MicIcon />
            </Pressable>
          )}
          <Pressable onPress={onPlus} style={[s.plusButton, { marginLeft: 12 }]} hitSlop={8} accessibilityLabel="Mais ações">
            <PlusIcon />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
