import { StyleSheet } from "react-native";
import { spacing } from "../../theme/spacing";
import { Radius } from "../../theme/radius";
import { Typography } from "../../theme/typography";
import type { AppTheme } from "../../theme/colors";

export const createSettingValueRowStyles = (t: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingRight: spacing.md,
    },
    leadingIconWrap: {
      width: 32,
      height: 32,
      borderRadius: Radius.round,
      backgroundColor: t.brand.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.brand.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    leadingIconText: {
      ...Typography.bodyRegular,
      color: t.textSecondary,
      fontWeight: "700",
    },
    rowLabel: {
      ...Typography.bodyRegular,
      color: t.textPrimary,
      flex: 1,
    },
    rowValue: {
      ...Typography.bodyRegular,
      color: t.textSecondary,
    },
    chevron: {
      marginLeft: spacing.xs,
      color: t.textSecondary,
      opacity: 0.6,
    },
    rightPressable: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
