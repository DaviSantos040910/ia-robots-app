// src/components/shared/BottomActionSheet.tsx
import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useTranslation } from "react-i18next";
import {
  createBottomActionSheetStyles,
  getBottomActionSheetTheme,
} from "./BottomActionSheet.styles";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface ActionSheetOption {
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
}

interface BottomActionSheetProps {
  visible: boolean;
  onClose: () => void;
  options: ActionSheetOption[];
  title?: string;
}

export const BottomActionSheet: React.FC<BottomActionSheetProps> = ({
  visible,
  onClose,
  options,
  title,
}) => {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  const theme = useMemo(
    () => getBottomActionSheetTheme(isDarkMode),
    [isDarkMode]
  );
  const s = useMemo(() => createBottomActionSheetStyles(theme), [theme]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const handleOptionPress = (onPress: () => void) => {
    onClose(); // Always close after an option is pressed
    onPress();
  };

  const renderOptions = () => (
    <View style={s.optionContainer}>
      {title && (
        <>
          <View style={s.titleSection}>
            <Text style={s.titleText}>{title}</Text>
          </View>
          <View style={s.separator} />
        </>
      )}
      {options.map((option, index) => (
        <React.Fragment key={option.label}>
          <Pressable
            onPress={() => handleOptionPress(option.onPress)}
            android_ripple={{ color: theme.separator }}
            style={s.optionRow}
          >
            <Text
              style={[s.optionText, option.isDestructive && s.destructiveText]}
            >
              {option.label}
            </Text>
          </Pressable>
          {index < options.length - 1 && <View style={s.separator} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]} />
        <Animated.View style={[s.container, { transform: [{ translateY }] }]}>
          <SafeAreaView edges={["bottom"]}>
            {renderOptions()}
            {/* AJUSTE: Botão "Cancel" removido */}
          </SafeAreaView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
