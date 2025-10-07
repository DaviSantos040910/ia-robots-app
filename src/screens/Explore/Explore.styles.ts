// src/screens/Explore/Explore.styles.ts
import { StyleSheet } from "react-native";
import {
  getTheme as getBaseTheme,
  ChatListTheme,
} from "../ChatList/ChatList.styles";
import { Spacing } from "../../theme/spacing";
import { Typography } from "../../theme/typography";
import { Radius } from "../../theme/radius";

export const getTheme = getBaseTheme;
export type ExploreTheme = ChatListTheme;

export const createExploreStyles = (t: ExploreTheme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.background },

    // --- Header styles ---
    header: {
      paddingHorizontal: Spacing["spacing-group-s"],
    },
    searchSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    searchBarContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.surfaceAlt,
      borderRadius: Radius.round,
      paddingHorizontal: Spacing["spacing-element-l"],
      height: 48,
    },
    searchInput: {
      flex: 1,
      ...Typography.bodyRegular.medium,
      color: t.textPrimary,
      marginLeft: Spacing["spacing-element-m"],
      fontSize: 16,
      paddingVertical: 0,
    },
    cancelButton: {
      paddingLeft: Spacing["spacing-group-s"],
    },
    cancelButtonText: {
      ...Typography.bodyMedium.medium,
      color: t.brand.normal,
      fontSize: 16,
    },

    // --- Category Filters ---
    categoryScrollView: {
      // AJUSTE: Controla o espaço entre a busca e os filtros (acima)
      // e entre os filtros e a lista (abaixo).
      paddingVertical: Spacing["spacing-element-l"],
    },
    categoryChip: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: Radius.round,
      backgroundColor: t.surfaceAlt,
      marginRight: 8,
    },
    categoryChipActive: {
      backgroundColor: t.brand.normal,
    },
    categoryText: {
      ...Typography.bodySemiBold.medium,
      color: t.textSecondary,
    },
    categoryTextActive: {
      color: "#FFFFFF",
    },

    // --- Main List styles ---
    listContentContainer: {
      paddingHorizontal: Spacing["spacing-group-s"],
      paddingBottom: 100,
    },

    // ExploreBotRow styles
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: t.surfaceAlt,
      marginRight: 14,
    },
    body: { flex: 1, marginRight: 12 },
    title: { ...Typography.titleSemiBold.medium, color: t.textPrimary },
    desc: {
      ...Typography.bodyRegular.medium,
      color: t.textSecondary,
      marginTop: 2,
    },
    followButton: { padding: 4 },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.border,
      marginLeft: 52 + 14,
      marginRight: Spacing["spacing-group-s"],
    },

    // --- Search History styles ---
    historyContainer: {
      paddingHorizontal: Spacing["spacing-group-s"],
    },
    historyRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing["spacing-element-l"],
    },
    historyRowContent: {
      flexDirection: "row",
      flex: 1,
      alignItems: "center",
    },
    historyText: {
      fontFamily: "Inter_400Regular",
      fontSize: 16,
      lineHeight: 20,
      color: t.textPrimary,
      marginLeft: Spacing["spacing-element-m"],
    },
    clearHistoryButton: {
      alignItems: "center",
      paddingVertical: Spacing["spacing-group-m"],
    },
    clearHistoryText: {
      ...Typography.bodyRegular.medium,
      color: t.textSecondary,
      fontSize: 14,
    },
  });
