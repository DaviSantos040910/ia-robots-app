// src/components/shared/BottomActionSheet.tsx
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, Animated, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NeutralColors } from '../../theme/neutralColors';
import { Radius } from '../../theme/radius';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Colors } from '../../theme/colors';

const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  const isDarkMode = scheme === 'dark';

  const theme = {
    background: isDarkMode ? NeutralColors.neutral.dark.gray1 : NeutralColors.neutral.light.gray1,
    surface: isDarkMode ? NeutralColors.neutral.dark.gray2 : NeutralColors.neutral.light.white1,
    textPrimary: isDarkMode ? NeutralColors.fontAndIcon.dark.wh1 : NeutralColors.fontAndIcon.light.primary,
    textSecondary: isDarkMode ? NeutralColors.fontAndIcon.dark.wh2 : NeutralColors.fontAndIcon.light.secondary,
    separator: isDarkMode ? NeutralColors.neutral.dark.gray3 : '#3c3c434a',
    destructive: Colors.semantic.error.normal,
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0.5, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
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

  const actionSheetStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000',
    },
    container: {
      backgroundColor: 'transparent',
      paddingHorizontal: Spacing['spacing-element-m'],
      paddingBottom: Platform.OS === 'ios' ? Spacing['spacing-element-m'] : Spacing['spacing-element-s'], // Adjusted padding for bottom safe area
    },
    optionContainer: {
      backgroundColor: theme.surface,
      // AJUSTE: Arredondamento aplicado a todo o contêiner de opções, incluindo o título
      borderRadius: Radius.large,
      overflow: 'hidden',
    },
    titleSection: {
      paddingVertical: Spacing['spacing-group-m'],
      paddingHorizontal: Spacing['spacing-group-m'],
      alignItems: 'center',
    },
    titleText: {
      ...Typography.bodyRegular.small, // Smaller text for the title
      color: theme.textSecondary,
      textAlign: 'center',
    },
    optionRow: {
      paddingVertical: Spacing['spacing-element-l'], // Adjusted vertical padding
      alignItems: 'center',
      justifyContent: 'center',
    },
    // AJUSTE: Fonte menor para as opções.
    optionText: {
      ...Typography.bodyRegular.medium, // Changed to bodyRegular.medium
      fontSize: 16, // Explicitly set font size to 16
      color: theme.textPrimary,
    },
    destructiveText: {
      color: theme.destructive,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.separator,
      marginHorizontal: Spacing['spacing-element-m'], // Added horizontal margin to separator
    },
  });

  const renderOptions = () => (
    <View style={actionSheetStyles.optionContainer}>
      {title && (
        <>
          <View style={actionSheetStyles.titleSection}>
            <Text style={actionSheetStyles.titleText}>{title}</Text>
          </View>
          <View style={actionSheetStyles.separator} />
        </>
      )}
      {options.map((option, index) => (
        <React.Fragment key={option.label}>
          <Pressable
            onPress={() => handleOptionPress(option.onPress)}
            android_ripple={{ color: theme.separator }}
            style={actionSheetStyles.optionRow}
          >
            <Text style={[actionSheetStyles.optionText, option.isDestructive && actionSheetStyles.destructiveText]}>
              {option.label}
            </Text>
          </Pressable>
          {index < options.length - 1 && (
            <View style={actionSheetStyles.separator} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Pressable style={actionSheetStyles.overlay} onPress={onClose}>
        <Animated.View style={[actionSheetStyles.backdrop, { opacity: backdropOpacity }]} />
        <Animated.View style={[actionSheetStyles.container, { transform: [{ translateY }] }]}>
          <SafeAreaView edges={['bottom']}>
            {renderOptions()}
            {/* AJUSTE: Botão "Cancel" removido */}
          </SafeAreaView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};