
import React from 'react';
import { View, Text } from 'react-native';
import { createBotSettingsStyles, getTheme } from '../../screens/BotSettings/BotSettings.styles';
import { useColorScheme } from 'react-native';

// Simple placeholder leading icon. Replace its content with your own icon lib later.
export const LeadingIcon: React.FC<{ glyph: string }> = ({ glyph }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createBotSettingsStyles(t);
  return (
    <View style={s.leadingIconWrap}>
      <Text style={s.leadingIconText}>{glyph}</Text>
    </View>
  );
};
