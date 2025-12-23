
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from "react-native";
import { getTheme } from "../../theme/colors";
import { Spacing } from "../../theme/spacing";
import { Typography } from "../../theme/typography";
import { Radius } from "../../theme/radius";

export const createSettingsStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background, // Should be light gray/white depending on theme
    } as ViewStyle,

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing["spacing-group-m"],
      paddingTop: Spacing["spacing-element-m"],
      paddingBottom: Spacing["spacing-group-m"],
      backgroundColor: theme.background,
    } as ViewStyle,

    headerTitle: {
      ...Typography.presets.heading3,
      flex: 1,
      textAlign: 'center',
      color: theme.textPrimary,
      marginRight: 24, // Balance the back button width
    } as TextStyle,

    backButton: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,

    content: {
      paddingHorizontal: Spacing["spacing-group-m"],
      paddingTop: Spacing["spacing-element-m"],
    } as ViewStyle,

    // Sections
    section: {
      backgroundColor: theme.surface, // White cards
      borderRadius: Radius.card, // e.g., 12 or 16
      marginBottom: Spacing["spacing-group-m"],
      overflow: 'hidden',
    } as ViewStyle,

    // Row
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing["spacing-group-s"],
      backgroundColor: theme.surface,
    } as ViewStyle,

    rowIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing["spacing-element-m"],
    } as ViewStyle,

    rowContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as ViewStyle,

    rowLabel: {
      ...Typography.bodyRegular.medium,
      color: theme.textPrimary,
      fontWeight: '500',
    } as TextStyle,

    rowValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,

    rowValue: {
      ...Typography.bodyRegular.small,
      color: theme.textSecondary,
      marginRight: Spacing["spacing-element-s"],
    } as TextStyle,

    divider: {
        height: 1,
        backgroundColor: theme.surfaceAlt, // or border
        marginLeft: 32 + Spacing["spacing-element-m"] + Spacing["spacing-group-s"], // Align with text
    } as ViewStyle,

    // Footer
    footer: {
        alignItems: 'center',
        paddingVertical: Spacing["spacing-layout-l"],
    } as ViewStyle,

    footerText: {
        ...Typography.bodyRegular.small,
        color: theme.textSecondary,
        marginBottom: 4,
    } as TextStyle,
  });

export const getThemeFunction = (isDark: boolean) => getTheme(isDark);
