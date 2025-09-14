
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useColorScheme } from 'react-native';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';

type Props = { label: string; onPress: () => void };

export const MiniSuggestionChip: React.FC<Props> = ({ label, onPress }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  return (
    <Pressable onPress={onPress} style={s.miniChip}>
      <Text style={s.miniChipText}>{label}</Text>
    </Pressable>
  );
};
