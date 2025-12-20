import React, { useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { FEATURES } from "../../config/featureFlags"; // Importando Flags
import type { Anchor } from "./ActionSheetMenu";

interface ChatHeaderProps {
  botName?: string;
  botImage?: string | null;
  isTyping?: boolean;
  onPressProfile?: () => void;
  onCallPress?: () => void; // Mantemos a prop para compatibilidade, mas controlamos a view

  title?: string;
  subtitle?: string;
  avatarUrl?: string | null;
  onBack?: () => void;
  onPhone?: () => void;
  onVolume?: () => void;
  isVoiceModeEnabled?: boolean;
  onMorePress?: (anchor: Anchor) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  botName,
  botImage,
  isTyping,
  onPressProfile,
  onCallPress,
  title,
  subtitle,
  avatarUrl,
  onBack,
  onPhone,
  onVolume,
  isVoiceModeEnabled,
  onMorePress,
}) => {
  const theme = useTheme();
  const navigation = useNavigation();

  const moreButtonRef = useRef<View | null>(null);

  const handleBack = useCallback(() => {
    if (onBack) return onBack();
    navigation.goBack();
  }, [navigation, onBack]);

  const handleMorePress = useCallback(() => {
    if (onMorePress) {
      moreButtonRef.current?.measureInWindow((x, y, width, height) => {
        onMorePress({ x, y, width, height });
      });
      return;
    }
    onPressProfile?.();
  }, [onMorePress, onPressProfile]);

  const displayName = title ?? botName ?? "";
  const displaySubtitle = subtitle;
  const displayImage = avatarUrl ?? botImage;
  const phoneHandler = onPhone ?? onCallPress;

  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: theme.brand.background,
          borderBottomColor: theme.brand.border,
        },
      ]}
    >
      <View style={s.leftContainer}>
        <TouchableOpacity onPress={handleBack} style={s.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.brand.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressProfile}
          style={s.profileContainer}
          activeOpacity={0.8}
        >
          {FEATURES.USE_CHARACTER_AVATAR ? (
            <Image
              source={
                displayImage
                  ? { uri: displayImage }
                  : require("../../assets/avatar.png")
              }
              style={s.avatar}
            />
          ) : (
            // Ícone técnico no header também
            <View
              style={[
                s.avatarPlaceholder,
                {
                  backgroundColor: theme.brand.surface,
                  borderColor: theme.brand.border,
                },
              ]}
            >
              <Ionicons
                name="library-outline"
                size={20}
                color={theme.brand.normal}
              />
            </View>
          )}
          <View>
            <Text style={[s.name, { color: theme.brand.text }]}>
              {displayName}
            </Text>
            {!!displaySubtitle ? (
              <Text style={[s.status, { color: theme.brand.textSecondary }]}>
                {displaySubtitle}
              </Text>
            ) : isTyping ? (
              <Text style={[s.status, { color: theme.brand.primary }]}>
                Processando...
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>

      <View style={s.rightContainer}>
        {/* Toggle de TTS (Feature Flag) */}
        {FEATURES.SHOW_HEADER_TTS_TOGGLE && !!onVolume && (
          <TouchableOpacity onPress={onVolume} style={s.iconButton}>
            <Ionicons
              name={
                isVoiceModeEnabled
                  ? "volume-high-outline"
                  : "volume-mute-outline"
              }
              size={24}
              color={theme.brand.text}
            />
          </TouchableOpacity>
        )}

        {/* Botão de Chamada (Feature Flag) */}
        {FEATURES.SHOW_PHONE_CALL_BUTTON && !!phoneHandler && (
          <TouchableOpacity onPress={phoneHandler} style={s.iconButton}>
            <Ionicons name="call-outline" size={24} color={theme.brand.text} />
          </TouchableOpacity>
        )}

        {/* Menu de Configurações do Bot/Doc (Sempre visível) */}
        <TouchableOpacity
          ref={moreButtonRef}
          onPress={handleMorePress}
          style={s.iconButton}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={theme.brand.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    elevation: 2, // Leve sombra
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.medium, // Quadrado
    marginRight: spacing.sm,
    backgroundColor: "#e0e0e0",
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: radius.medium,
    marginRight: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  name: {
    ...typography.subtitle1,
    fontWeight: "700",
  },
  status: {
    ...typography.caption,
    fontWeight: "500",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
});
