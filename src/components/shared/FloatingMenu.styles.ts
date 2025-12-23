import { StyleSheet } from "react-native";
import { spacing } from "../../theme/spacing";
import { Radius } from "../../theme/radius";
import { Typography } from "../../theme/typography";

type FloatingMenuTheme = {
  surface: string;
  border: string;
  textPrimary: string;
};

export const createFloatingMenuStyles = (t: FloatingMenuTheme) =>
  StyleSheet.create({
    backdropPressable: {
      flex: 1,
    },
    absoluteFill: {
      ...StyleSheet.absoluteFillObject,
    },
    menu: {
      position: "absolute",
      backgroundColor: t.surface,
      borderRadius: Radius.medium,
      paddingVertical: spacing.xs,
      minWidth: 180,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    option: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    optionText: {
      ...Typography.bodyRegular,
      fontSize: 16,
      color: t.textPrimary,
      fontWeight: "400",
    },
    optionTextSelected: {
      fontWeight: "600",
    },
  });
