// src/components/shared/FormField.tsx
import React from 'react';
import { Text, TextInput, View, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radius } from '../../theme/radius';
import { Spacing } from '../../theme/spacing';

interface FormFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  multiline?: boolean;
  style?: ViewStyle;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  error,
  multiline = false,
  style,
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: Spacing['spacing-group-s'],
      ...style,
    } as ViewStyle,
    label: {
      ...Typography.presets.label,
      color: theme.textSecondary,
      marginBottom: Spacing['spacing-element-xs'],
      marginLeft: 4,
    } as TextStyle,
    input: {
      backgroundColor: theme.surfaceAlt, // Light gray background
      borderRadius: Radius.input,
      paddingHorizontal: Spacing['spacing-element-m'],
      paddingVertical: Spacing['spacing-element-m'], // Comfortable touch target
      fontSize: 16,
      fontFamily: 'Inter_400Regular',
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: error ? '#DC2626' : 'transparent', // Red if error
    } as TextStyle,
    inputFocused: {
        borderColor: theme.brand.normal,
        backgroundColor: theme.background,
    },
    errorText: {
      ...Typography.presets.caption,
      color: '#DC2626',
      marginTop: 4,
      marginLeft: 4,
    } as TextStyle,
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, multiline && { height: 100, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
