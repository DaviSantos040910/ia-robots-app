import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { radius } from "../../theme/radius";
import { typography } from "../../theme/typography";
import Ionicons from "@expo/vector-icons/Ionicons";
import { FEATURES } from "../../config/featureFlags"; // Import flags

interface ExploreBotRowProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  category?: string;
  author?: string;
  isSubscribed?: boolean;
  onToggleSubscribe?: () => void;
  onPress: () => void;
}

export const ExploreBotRow: React.FC<ExploreBotRowProps> = ({
  name,
  description,
  imageUrl,
  category,
  author,
  isSubscribed,
  onToggleSubscribe,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        s.container,
        {
          backgroundColor: theme.brand.background,
          borderColor: theme.brand.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Lógica de Avatar: Usa imagem se existir, senão ícone de biblioteca */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
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

      {/* Seta de navegação técnica */}
      <Ionicons name="chevron-forward" size={16} color={theme.brand.border} />
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.medium,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: radius.medium,
    marginRight: spacing.md,
    backgroundColor: "transparent",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
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
    marginBottom: 4,
  },
  name: {
    ...typography.subtitle1,
    fontWeight: "600",
    flex: 1,
    marginRight: spacing.xs,
  },
  description: {
    ...typography.body2,
    lineHeight: 18,
    marginBottom: 0,
  },
});
