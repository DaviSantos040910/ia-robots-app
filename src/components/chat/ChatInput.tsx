import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { useColorScheme } from 'react-native';

type Props = {
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  onMic: () => void;
  onPlus: () => void;
};

const MicIcon = () => <Text>{'🎤'}</Text>;
const PlusIcon = () => <Text>{'＋'}</Text>;

export const ChatInput: React.FC<Props> = ({
  value,
  placeholder,
  onChangeText,
  onSend,
  onMic,
  onPlus,
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  return (
    <View style={s.inputWrap}>
      <View style={s.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={s.placeholder.color}
          style={s.textInput}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <View style={s.inputIcons}>
          <Pressable onPress={onMic} style={s.iconButton} hitSlop={8}>
            <MicIcon />
          </Pressable>
          <Pressable onPress={onPlus} style={s.plusButton} hitSlop={8}>
            <PlusIcon />
          </Pressable>
        </View>
      </View>
    </View>
  );
};