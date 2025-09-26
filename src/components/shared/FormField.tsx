
import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { createCreateBotStyles, getTheme } from '../../screens/CreateBot/CreateBot.styles';

export const FormField: React.FC<{
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
}> = ({ label, value, onChangeText, placeholder, multiline }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createCreateBotStyles(t);
  return (
    <View style={s.fieldBlock}>
      <Text style={s.labelText}>{label}</Text>
      <TextInput
        style={multiline ? s.inputMultiline : s.inputBase}
        placeholder={placeholder}
        placeholderTextColor={t.placeholder}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
      />
    </View>
  );
};
