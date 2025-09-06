
import React from 'react';
import { Pressable, Text } from 'react-native';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { useColorScheme } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
};

export const SuggestionChip: React.FC<Props> = ({ label, onPress }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  return (
    <Pressable onPress={onPress} style={s.chip}>
      <Text style={s.chipText}>{label}</Text>
    </Pressable>
  );
};
