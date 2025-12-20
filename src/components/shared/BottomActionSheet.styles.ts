import { StyleSheet, Platform } from "react-native";
import { Radius } from "../../theme/radius";
import { Spacing } from "../../theme/spacing";
import { Typography } from "../../theme/typography";
import { NeutralColors } from "../../theme/neutralColors";
import { Colors } from "../../theme/colors";

export type BottomActionSheetTheme = {
  surface: string;
  textPrimary: string;
  textSecondary: string;
  separator: string;
  destructive: string;
};

export const getBottomActionSheetTheme = (
  isDarkMode: boolean
): BottomActionSheetTheme => ({
  surface: isDarkMode
    ? NeutralColors.neutral.dark.gray2
    : NeutralColors.neutral.light.white1,
  textPrimary: isDarkMode
    ? NeutralColors.fontAndIcon.dark.wh1
    : NeutralColors.fontAndIcon.light.primary,
  textSecondary: isDarkMode
    ? NeutralColors.fontAndIcon.dark.wh2
    : NeutralColors.fontAndIcon.light.secondary,
  separator: isDarkMode
    ? NeutralColors.neutral.dark.gray3
    : NeutralColors.neutral.light.gray3,
  destructive: Colors.semantic.error.normal,
});

export const createBottomActionSheetStyles = (t: BottomActionSheetTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: NeutralColors.neutral.dark.black1,
    },
    container: {
      backgroundColor: "transparent",
      paddingHorizontal: Spacing["spacing-element-m"],
      paddingBottom:
        Platform.OS === "ios"
          ? Spacing["spacing-element-m"]
          : Spacing["spacing-element-s"],
    },
    optionContainer: {
      backgroundColor: t.surface,
      borderRadius: Radius.large,
      overflow: "hidden",
    },
    titleSection: {
      paddingVertical: Spacing["spacing-group-m"],
      paddingHorizontal: Spacing["spacing-group-m"],
      alignItems: "center",
    },
    titleText: {
      ...Typography.bodyRegular.small,
      color: t.textSecondary,
      textAlign: "center",
    },
    optionRow: {
      paddingVertical: Spacing["spacing-element-l"],
      alignItems: "center",
      justifyContent: "center",
    },
    optionText: {
      ...Typography.bodyRegular.medium,
      fontSize: 16,
      color: t.textPrimary,
    },
    destructiveText: {
      color: t.destructive,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.separator,
      marginHorizontal: Spacing["spacing-element-m"],
    },
  });
