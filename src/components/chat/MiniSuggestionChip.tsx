
import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';

type Props = { label: string; onPress: () => void; disabled?: boolean };

export const MiniSuggestionChip: React.FC<Props> = ({ label, onPress, disabled }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  const disabledStyle: ViewStyle = disabled ? { opacity: 0.5 } : {};
  return (
   <Pressable
        onPress={onPress}
        style={[s.miniChip, disabledStyle]} // Aplica o estilo de opacidade
        disabled={disabled} // Desabilita o toque
    >
      <Text style={s.miniChipText}>{label}</Text>
    </Pressable>
  );
};
