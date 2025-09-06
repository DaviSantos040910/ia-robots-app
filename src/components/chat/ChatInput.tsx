
import React from 'react';
import { Pressable, Text, TextInput, View, LayoutChangeEvent, Platform } from 'react-native';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = { value: string; placeholder: string; onChangeText: (v: string) => void; onSend: () => void; onMic: () => void; onPlus: () => void; onHeightChange?: (h: number) => void; };

const MicIcon = () => <Text>{'🎙️'}</Text>;
const PlusIcon = () => <Text>{'＋'}</Text>;
const SendIcon = () => <Text>{'➤'}</Text>;

export const ChatInput: React.FC<Props> = ({ value, placeholder, onChangeText, onSend, onMic, onPlus, onHeightChange }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  const insets = useSafeAreaInsets();

  const handleLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height + Math.max(insets.bottom, 4);
    onHeightChange?.(h);
  };

  const canSend = value.trim().length > 0;

  return (
    <View style={[s.inputWrap, { paddingBottom: Math.max(insets.bottom, 6) }]} onLayout={handleLayout}>
      <View style={s.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={(s.placeholder as any).color}
          style={s.textInput}
          multiline
          textAlignVertical={Platform.OS === 'android' ? 'center' : 'auto'}
          returnKeyType={'default'}
          blurOnSubmit={false}
        />
        <View style={s.inputIcons}>
          {canSend ? (
            <Pressable onPress={onSend} style={s.iconButton} hitSlop={8} accessibilityLabel="Enviar mensagem">
              <SendIcon />
            </Pressable>
          ) : (
            <Pressable onPress={onMic} style={s.iconButton} hitSlop={8} accessibilityLabel="Gravar áudio">
              <MicIcon />
            </Pressable>
          )}
          <Pressable onPress={onPlus} style={[s.plusButton, s.mlIcon]} hitSlop={8} accessibilityLabel="Mais ações">
            <PlusIcon />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
