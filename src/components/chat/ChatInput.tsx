// src/components/chat/ChatInput.tsx

import React, { useEffect, useState, memo } from "react";
import {
  Pressable,
  TextInput,
  View,
  LayoutChangeEvent,
  Platform,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RecordingState } from "../../hooks/useAudioRecorder";
import { createChatStyles, getTheme } from "../../screens/Chat/Chat.styles";
import { Colors } from "../../theme/colors";
import { NeutralColors } from "../../theme/neutralColors";

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  onMic: () => void;
  onPlus: () => void;
  onHeightChange?: (h: number) => void;
  recordingState: RecordingState;
  recordingDuration: string;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  isTranscribing?: boolean;
};

const LINE_HEIGHT = Platform.select({ ios: 22, android: 24, default: 22 });
const MAX_LINES = 5;
const MIN_LINES = 1;
const MAX_INPUT_HEIGHT = LINE_HEIGHT * MAX_LINES;
const MIN_INPUT_HEIGHT = LINE_HEIGHT * MIN_LINES;

const ChatInputComponent: React.FC<Props> = ({
  value,
  onChangeText,
  onSend,
  onMic,
  onPlus,
  onHeightChange,
  recordingState,
  recordingDuration,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onCancelRecording,
  isTranscribing = false,
}) => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === "dark");
  const s = createChatStyles(theme);

  const [contentHeight, setContentHeight] = useState(MIN_INPUT_HEIGHT);

  useEffect(() => {
    if (!value?.trim()) {
      setContentHeight(MIN_INPUT_HEIGHT);
    }
  }, [value]);

  const handleLayout = (e: LayoutChangeEvent) => {
    onHeightChange?.(e.nativeEvent.layout.height);
  };

  const onContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    const h = e.nativeEvent.contentSize?.height || MIN_INPUT_HEIGHT;
    setContentHeight(h);
  };

  const canSend = value.trim().length > 0;
  const inputHeight = Math.min(
    MAX_INPUT_HEIGHT,
    Math.max(MIN_INPUT_HEIGHT, contentHeight)
  );
  const enableScroll = contentHeight > MAX_INPUT_HEIGHT;

  if (isTranscribing) {
    return (
      <View style={s.inputWrap} onLayout={handleLayout}>
        <View style={s.recordingContainer}>
          <ActivityIndicator size="small" color={theme.brand.normal} />
          <Text style={s.recordingText}>{t("chat.transcribing")}</Text>
        </View>
      </View>
    );
  }

  if (recordingState !== "idle") {
    return (
      <View style={s.inputWrap} onLayout={handleLayout}>
        <View style={s.recordingContainer}>
          <Pressable
            onPress={onCancelRecording}
            style={({ pressed }) => [
              s.recordingButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityLabel={t("common.cancel")}
            accessibilityRole="button"
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color={Colors.semantic.error.normal}
            />
          </Pressable>

          <View style={s.recordingIndicator}>
            <View
              style={[
                s.recordingDot,
                {
                  backgroundColor:
                    recordingState === "recording"
                      ? Colors.semantic.error.normal
                      : theme.textSecondary,
                },
                recordingState === "recording" && s.recordingDotActive,
              ]}
            />
            <Text style={s.recordingDuration}>{recordingDuration}</Text>
          </View>

          <Pressable
            onPress={
              recordingState === "recording"
                ? onPauseRecording
                : onResumeRecording
            }
            style={({ pressed }) => [
              s.recordingButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons
              name={
                recordingState === "recording" ? "pause-outline" : "mic-outline"
              }
              size={24}
              color={theme.textPrimary}
            />
          </Pressable>

          <Pressable
            onPress={onStopRecording}
            style={({ pressed }) => [
              s.recordingButton,
              {
                backgroundColor: theme.brand.normal,
                borderRadius: 20,
                padding: 8,
                marginLeft: 8,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityLabel={t("common.send")}
            accessibilityRole="button"
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={NeutralColors.neutral.light.white1}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.inputWrap} onLayout={handleLayout}>
      <View style={s.inputContainer}>
        <Pressable onPress={onPlus} hitSlop={10} style={s.inputIconButton}>
          <Ionicons name="add-outline" size={24} color={theme.textSecondary} />
        </Pressable>

        <TextInput
          style={[s.textInput, { height: inputHeight }]}
          placeholder={t("chat.input_placeholder")}
          placeholderTextColor={theme.placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline
          scrollEnabled={enableScroll}
          onContentSizeChange={onContentSizeChange}
          textAlignVertical="center"
        />

        {canSend ? (
          <Pressable onPress={onSend} hitSlop={10} style={s.inputIconButton}>
            <Ionicons
              name="create-outline"
              size={24}
              color={theme.brand.normal}
            />
          </Pressable>
        ) : (
          <Pressable
            onPress={onMic}
            hitSlop={10}
            style={({ pressed }) => ({
              padding: s.inputIconButton.padding,
              opacity: pressed ? 0.6 : 1,
            })}
            accessibilityLabel={t("chat.accessibility.recordVoice")}
            accessibilityRole="button"
          >
            <Ionicons
              name="mic-outline"
              size={24}
              color={theme.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export const ChatInput = memo(ChatInputComponent);
