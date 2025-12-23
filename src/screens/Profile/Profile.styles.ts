import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from "react-native";
import { getTheme } from "../../theme/colors";
import { Spacing } from "../../theme/spacing";
import { Typography } from "../../theme/typography";
import { Radius } from "../../theme/radius";

export const createProfileStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    } as ViewStyle,

    // Header
    headerContainer: {
      backgroundColor: theme.background,
    } as ViewStyle,

    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing["spacing-group-m"],
      paddingTop: Spacing["spacing-layout-m"],
      paddingBottom: Spacing["spacing-element-s"],
    } as ViewStyle,

    settingsButton: {
      padding: Spacing["spacing-element-xs"],
      borderRadius: Radius.button,
      backgroundColor: theme.surface,
    } as ViewStyle,

    header: {
      paddingHorizontal: Spacing["spacing-group-m"],
      paddingTop: Spacing["spacing-layout-m"],
      paddingBottom: Spacing["spacing-element-m"],
      alignItems: "flex-start",
    } as ViewStyle,

    avatarContainer: {
      marginBottom: Spacing["spacing-element-s"],
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    } as ViewStyle,

    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40, // Circular
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
    } as ImageStyle,

    userInfo: {
      marginTop: Spacing["spacing-element-s"],
    } as ViewStyle,

    userName: {
      ...Typography.presets.heading2,
      color: theme.textPrimary,
    } as TextStyle,

    userHandle: {
      ...Typography.bodyRegular.medium,
      color: theme.textSecondary,
      marginTop: 2,
    } as TextStyle,

    userId: {
      ...Typography.bodyRegular.regular,
      color: theme.placeholder,
      marginTop: 2,
    } as TextStyle,

    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing["spacing-group-m"],
      paddingVertical: Spacing["spacing-element-s"],
    } as ViewStyle,

    editButton: {
      backgroundColor: theme.brand.primary,
      borderRadius: Radius.button,
      paddingHorizontal: Spacing["spacing-element-m"],
      paddingVertical: Spacing["spacing-element-s"],
      flexDirection: "row",
      alignItems: "center",
      shadowColor: theme.brand.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    } as ViewStyle,

    // Section
    sectionHeader: {
      marginTop: Spacing["spacing-layout-m"],
      marginBottom: Spacing["spacing-element-s"],
      paddingHorizontal: Spacing["spacing-group-m"],
    } as ViewStyle,

    sectionTitle: {
      ...Typography.presets.heading2,
      color: theme.textPrimary,
    } as TextStyle,

    listContent: {
      paddingBottom: Spacing["spacing-layout-xl"],
    } as ViewStyle,

    // Empty State
    emptyState: {
      padding: Spacing["spacing-layout-l"],
      alignItems: "center",
      justifyContent: "center",
      marginTop: Spacing["spacing-layout-xl"],
    } as ViewStyle,

    emptyStateText: {
      ...Typography.bodyRegular.medium,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: Spacing["spacing-layout-m"],
    } as TextStyle,

    createButton: {
      minWidth: 200,
    } as ViewStyle,

    // Tabs
    tabsContainer: {
      flexDirection: "row",
      paddingHorizontal: Spacing["spacing-group-m"],
      paddingVertical: Spacing["spacing-element-s"],
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    } as ViewStyle,

    tabChip: {
      paddingHorizontal: Spacing["spacing-element-m"],
      paddingVertical: Spacing["spacing-element-s"],
      borderRadius: Radius.pill,
      backgroundColor: theme.surface,
      marginRight: Spacing["spacing-element-s"],
    } as ViewStyle,

    activeTabChip: {
      paddingHorizontal: Spacing["spacing-element-m"],
      paddingVertical: Spacing["spacing-element-s"],
      borderRadius: Radius.pill,
      backgroundColor: theme.brand.primary,
      marginRight: Spacing["spacing-element-s"],
    } as ViewStyle,

    tabText: {
      ...Typography.bodyRegular.medium,
      color: theme.textSecondary,
      textAlign: "center",
    } as TextStyle,

    activeTabText: {
      ...Typography.bodyRegular.medium,
      color: theme.background,
      textAlign: "center",
    } as TextStyle,

    // List Headers
    listHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing["spacing-group-m"],
      paddingVertical: Spacing["spacing-element-m"],
      backgroundColor: theme.background,
    } as ViewStyle,

    listHeaderTitle: {
      ...Typography.presets.heading3,
      color: theme.textPrimary,
    } as TextStyle,
  });

export const getThemeFunction = (isDark: boolean) => getTheme(isDark);
