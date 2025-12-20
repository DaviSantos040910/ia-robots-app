import React, { useMemo } from "react";
import {
  View,
  Text,
  StatusBar,
  Image,
  Pressable,
  useColorScheme,
  Alert,
  StyleProp,
  ViewStyle,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { RootStackParamList } from "../../types/navigation";
import { getTheme, createVoiceCallStyles } from "./VoiceCall.styles";
import { useVoiceCallLogic, VoiceCallStatus } from "./hooks/useVoiceCallLogic";

type Props = NativeStackScreenProps<RootStackParamList, "VoiceCall">;

const VoiceCallScreen: React.FC<Props> = ({ route, navigation }) => {
  const { botName, botAvatarUrl, chatId } = route.params;
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const theme = getTheme(isDark);
  const styles = createVoiceCallStyles(theme);

  const {
    callState,
    recordingState,
    startRecordingInCall,
    stopRecordingAndSend,
    cancelInteraction,
    feedbackText,
    audioLevel,
  } = useVoiceCallLogic({
    chatId,
    onError: (msg) => Alert.alert(t("common.ops"), msg),
  });

  const handleGoBack = () => {
    cancelInteraction();
    navigation.goBack();
  };

  // --- Animations ---
  const avatarAnimatedStyle = useAnimatedStyle(() => {
    if (callState !== "RECORDING") {
      return { transform: [{ scale: withSpring(1) }] };
    }
    const scale = interpolate(
      audioLevel.value,
      [-60, -10],
      [1, 1.4],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { scale: withSpring(scale, { damping: 10, stiffness: 100 }) },
      ],
    };
  });

  const botSpeakingStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(callState === "SPEAKING" ? 1.05 : 1, {
            damping: 20,
          }),
        },
      ],
    };
  });

  // --- Dynamic Styles Helpers & Status Text ---
  const getStatusConfig = (state: VoiceCallStatus, recState: string) => {
    // Prioridade máxima para RECORDING (Feedback imediato ao toque)
    if (state === "RECORDING") {
      return { text: "Ouvindo você...", color: "#FF4B4B" };
    }

    if (state === "PROCESSING") {
      return { text: "Pensando...", color: "#F59E0B" }; // Amarelo/Laranja para loading
    }

    if (state === "SPEAKING") {
      return { text: "Falando... (Toque para interromper)", color: "#10B981" };
    }

    if (recState === "initializing") {
      return { text: "Preparando microfone...", color: theme.textSecondary };
    }

    return { text: t("voiceCall.status.idle"), color: theme.textSecondary };
  };

  const statusConfig = useMemo(
    () => getStatusConfig(callState, recordingState),
    [callState, recordingState, theme, t]
  );

  // --- Computed Style Objects ---
  const avatarContainerStyle = useMemo(
    () => [
      styles.avatarContainer,
      {
        borderColor:
          callState === "SPEAKING" ? statusConfig.color : theme.border,
        borderWidth: callState === "SPEAKING" ? 4 : 1,
      },
      callState === "RECORDING" ? avatarAnimatedStyle : botSpeakingStyle,
    ],
    [
      styles,
      callState,
      statusConfig.color,
      theme.border,
      avatarAnimatedStyle,
      botSpeakingStyle,
    ]
  );

  const primaryButtonStyle = useMemo(
    () =>
      ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> =>
        [
          styles.primaryButton,
          callState === "RECORDING" && styles.primaryButtonRecording,
          // Removida opacidade de disabled para indicar que sempre é interativo
          { transform: [{ scale: pressed ? 0.9 : 1 }] }, // Feedback visual de toque mais responsivo
        ],
    [styles, callState]
  );

  const secondaryButtonStyle = useMemo(
    () =>
      ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> =>
        [styles.secondaryButton, { opacity: pressed ? 0.7 : 1 }],
    [styles]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        animated
      />

      <View style={styles.infoContainer}>
        <Animated.View style={avatarContainerStyle}>
          {botAvatarUrl ? (
            <Image
              source={{ uri: botAvatarUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name="journal-outline"
              size={64}
              color={theme.textSecondary}
            />
          )}
        </Animated.View>

        <Text style={styles.botName} numberOfLines={1}>
          {botName}
        </Text>

        <Text
          style={[
            styles.statusText,
            { color: statusConfig.color },
            callState !== "IDLE" && styles.statusTextBold,
          ]}
        >
          {statusConfig.text}
        </Text>

        {!!feedbackText && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>"{feedbackText}"</Text>
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <Pressable
          onPress={handleGoBack}
          style={secondaryButtonStyle}
          accessibilityLabel={t("voiceCall.accessibility.close")}
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={theme.textPrimary} />
        </Pressable>

        <Pressable
          // Interação irrestrita: onPressIn cancela tudo e começa a gravar imediatamente
          onPressIn={startRecordingInCall}
          onPressOut={stopRecordingAndSend}
          // Disabled removido propositalmente para permitir Barge-in
          style={primaryButtonStyle}
          accessibilityLabel={t("voiceCall.accessibility.mic")}
          accessibilityRole="button"
        >
          {/* Sempre mostra o ícone de microfone para reforçar a disponibilidade da ação */}
          <Ionicons
            name={callState === "RECORDING" ? "mic-outline" : "mic-outline"}
            size={40}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.secondaryButtonPlaceholder} />
      </View>
    </SafeAreaView>
  );
};

export default VoiceCallScreen;
