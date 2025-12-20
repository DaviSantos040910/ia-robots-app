import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { radius } from "../../theme/radius";
import { Typography } from "../../theme/typography";
import Ionicons from "@expo/vector-icons/Ionicons";
import { FEATURES } from "../../config/featureFlags"; // Importando Flags

interface BotRowProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  onPress: () => void;
  showBorder?: boolean;
}

export const BotRow: React.FC<BotRowProps> = ({
  name,
  description,
  imageUrl,
  onPress,
  showBorder = true,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        s.container,
        {
          backgroundColor: theme.brand.background,
          borderBottomColor: theme.brand.border,
          borderBottomWidth: showBorder ? 1 : 0,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar Lógica: Flag define se mostra Imagem ou Ícone de Pasta */}
      {FEATURES.USE_CHARACTER_AVATAR ? (
        <Image
          source={
            imageUrl ? { uri: imageUrl } : require("../../assets/avatar.png")
          }
          style={[s.avatar, { backgroundColor: theme.brand.surface }]}
        />
      ) : (
        <View
          style={[
            s.avatarPlaceholder,
            {
              backgroundColor: theme.brand.surface,
              borderColor: theme.brand.border,
            },
          ]}
        >
          {/* Ícone técnico de 'Documento/Base de Conhecimento' */}
          <Ionicons
            name="library-outline"
            size={24}
            color={theme.brand.normal}
          />
        </View>
      )}

      <View style={s.content}>
        <View style={s.header}>
          <Text style={[s.name, { color: theme.brand.text }]} numberOfLines={1}>
            {name}
          </Text>
        </View>

        <Text
          style={[s.description, { color: theme.brand.textSecondary }]}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      {/* Seta discreta indicando navegação */}
      <Ionicons name="chevron-forward" size={16} color={theme.brand.border} />
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.medium, // Avatar quadrado (técnico)
    marginRight: spacing.md,
    backgroundColor: "transparent",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radius.medium,
    marginRight: spacing.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  name: {
    ...Typography.presets.heading3,
  },
  description: {
    ...Typography.presets.bodySmall,
  },
});
