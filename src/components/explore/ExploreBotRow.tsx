
import React, { useMemo } from "react";
import { TouchableOpacity, View, Text, StyleSheet, Image, ViewStyle, TextStyle, ImageStyle } from "react-native";
import { useTheme } from "../../theme/colors";
import { Typography } from "../../theme/typography";
import { Spacing } from "../../theme/spacing";
import { Radius } from "../../theme/radius";
import Ionicons from "@expo/vector-icons/Ionicons";

interface ExploreBotRowProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  onPress: () => void;
}

export const ExploreBotRow: React.FC<ExploreBotRowProps> = ({
  id,
  name,
  description,
  imageUrl,
  onPress,
}) => {
  const theme = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: "row",
      padding: Spacing["spacing-group-s"],
      marginBottom: Spacing["spacing-element-m"],
      backgroundColor: theme.surface,
      borderRadius: Radius.card,
      // Subtle shadow for cards
      shadowColor: theme.brand.light, 
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      alignItems: 'center',
    } as ViewStyle,
    
    imageContainer: {
        marginRight: Spacing["spacing-group-s"],
    } as ViewStyle,

    image: {
      width: 56,
      height: 56,
      borderRadius: Radius.sm, // Rounded square
      backgroundColor: theme.surfaceAlt,
    } as ImageStyle,
    
    placeholder: {
        width: 56,
        height: 56,
        borderRadius: Radius.sm,
        backgroundColor: theme.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,

    content: {
      flex: 1,
      justifyContent: "center",
    } as ViewStyle,

    name: {
      ...Typography.presets.heading3, // Smaller heading or bold body
      fontSize: 16,
      color: theme.textPrimary,
      marginBottom: 4,
    } as TextStyle,

    description: {
      ...Typography.presets.bodyRegular.small,
      color: theme.textSecondary,
    } as TextStyle,
    
    chevron: {
        marginLeft: Spacing["spacing-element-s"],
    } as ViewStyle
  }), [theme]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
             <View style={styles.placeholder}>
                 <Ionicons name="journal-outline" size={24} color={theme.brand.normal} />
             </View>
          )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={theme.disabled} style={styles.chevron} />
    </TouchableOpacity>
  );
};
