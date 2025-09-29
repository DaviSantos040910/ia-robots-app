// src/components/shared/LabeledTextInput.tsx
import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useColorScheme } from 'react-native';
import { getTheme, createCreateBotStyles } from '../../screens/CreateBot/CreateBot.styles';

// AJUSTE: Adicionada a propriedade opcional 'description' à interface.
interface LabeledTextInputProps extends TextInputProps {
  label: string;
  description?: string;
  error?: string;
}

export const LabeledTextInput: React.FC<LabeledTextInputProps> = ({ label, description, error, style, ...rest }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createCreateBotStyles(theme);

  return (
    <View style={s.labeledInputContainer}>
      <Text style={s.labeledInputLabel}>{label}</Text>
      {/* AJUSTE: O componente agora renderiza o texto da descrição se ele for fornecido. */}
      {description && <Text style={s.labeledInputDescription}>{description}</Text>}
      <TextInput
        style={[s.textInput, style]}
        placeholderTextColor={theme.textSecondary}
        {...rest}
      />
      {error && <Text style={s.inputErrorText}>{error}</Text>}
    </View>
  );
};