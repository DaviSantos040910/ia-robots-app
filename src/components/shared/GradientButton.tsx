// src/components/shared/GradientButton.tsx
// Refactored to be a Solid Color Button (NotebookLM style)
// We keep the name "GradientButton" to minimize refactoring elsewhere, but implementation changes.

import React from "react";
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../theme/colors";
import { Typography } from "../../theme/typography";
import { Radius } from "../../theme/radius";

interface GradientButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger";
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  loading = false,
  variant = "primary",
  onPress,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const theme = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.disabled;
    switch (variant) {
      case "primary":
        return theme.brand.normal; // Indigo
      case "secondary":
        return theme.surfaceAlt; // Light Gray
      case "danger":
        return "#DC2626"; // Red
      case "outline":
        return "transparent";
      default:
        return theme.brand.normal;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    switch (variant) {
      case "primary":
      case "danger":
        return "#FFFFFF";
      case "secondary":
        return theme.textPrimary;
      case "outline":
        return theme.brand.normal;
      default:
        return "#FFFFFF";
    }
  };

  const getBorder = () => {
      if (variant === 'outline') {
          return {
              borderWidth: 1,
              borderColor: theme.brand.normal
          }
      }
      return {};
  }

  const baseStyle: ViewStyle = {
    height: 48,
    borderRadius: Radius.pill, // NotebookLM uses pill buttons often or rounded rects
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: getBackgroundColor(),
    opacity: disabled ? 0.6 : 1,
    paddingHorizontal: 24,
    ...getBorder(),
    ...style,
  };

  const labelStyle: TextStyle = {
    ...Typography.presets.button,
    color: getTextColor(),
    fontWeight: "600",
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={baseStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
