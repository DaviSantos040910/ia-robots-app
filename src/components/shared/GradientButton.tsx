// src/components/shared/GradientButton.tsx
import React, { useRef, useEffect } from "react";
import {
  Pressable,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useScaleOnPress } from "./Motion";
import { useColorScheme } from "react-native";
import { Colors } from "../../theme/colors";
import { s } from "./GradientButton.styles";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  gradientColors,
}) => {
  const { style: pressStyle, onPressIn, onPressOut } = useScaleOnPress();
  const scheme = useColorScheme();

  const defaultGradientColors =
    scheme === "dark"
      ? [Colors.brand.dark.normal, Colors.brand.dark.dark]
      : [Colors.brand.light.normal, Colors.brand.light.dark];

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading ? 0 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fadeAnim]);

  const buttonDisabled = disabled || isLoading;

  // AJUSTE: O componente foi reestruturado para aplicar a animação de escala
  // em um `Animated.View` externo, que é a prática correta.
  return (
    <Animated.View style={[pressStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={buttonDisabled}
      >
        <View style={[s.innerWrap, { opacity: buttonDisabled ? 0.6 : 1 }]}>
          <LinearGradient
            colors={gradientColors || defaultGradientColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={s.gradient}
          >
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={s.title.color}
                style={s.loading}
              />
            )}
            <Animated.Text style={[s.title, { opacity: fadeAnim }, textStyle]}>
              {title}
            </Animated.Text>
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
};
