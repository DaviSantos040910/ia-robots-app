
import { StyleSheet } from 'react-native';
import { NeutralColors } from '../../theme/neutralColors';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Radius } from '../../theme/radius';
import { Typography } from '../../theme/typography';

export const getTheme = (isDark: boolean) => {
  const font = isDark
    ? { primary: NeutralColors.fontAndIcon.dark.wh1, secondary: NeutralColors.fontAndIcon.dark.wh2, placeholder: NeutralColors.fontAndIcon.dark.wh3, disabled: NeutralColors.fontAndIcon.dark.wh4 }
    : NeutralColors.fontAndIcon.light as any;

  const background = isDark ? NeutralColors.neutral.dark.gray1 : NeutralColors.neutral.light.gray1;
  const surface = isDark ? NeutralColors.neutral.dark.gray2 : NeutralColors.neutral.light.white1;
  const surfaceAlt = isDark ? NeutralColors.neutral.dark.gray3 : NeutralColors.neutral.light.gray2;
  const border = isDark ? NeutralColors.neutral.dark.gray3 : NeutralColors.neutral.light.gray3;

  return {
    isDark,
    background,
    surface,
    surfaceAlt,
    border,
    textPrimary: (font as any).primary,
    textSecondary: (font as any).secondary,
    placeholder: (font as any).placeholder,
    disabled: (font as any).disabled,
    brand: { normal: Colors.brand.light.normal, surface: Colors.brand.light.surface },
    danger: { normal: Colors.semantic.error.normal },
  } as const;
};
export type SettingsTheme = ReturnType<typeof getTheme>;

export const createBotSettingsStyles = (t: SettingsTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },

  // top actions bar (no full header)
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['spacing-group-s'], marginTop: Spacing['spacing-element-l'] },
  leftGroup: { flexDirection: 'row', alignItems: 'center' },
  rightGroup: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8, borderRadius: 999 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  topIconText: { ...Typography.bodyRegular.medium, color: t.textPrimary },

  content: { padding: Spacing['spacing-group-s'], paddingTop: Spacing['spacing-group-m'] },

  identityRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: t.surfaceAlt, marginRight: 12 },
  title: { ...Typography.titleSemiBold.medium, color: t.textPrimary },
  byline: { ...Typography.bodyRegular.small, color: t.textSecondary },
  chipRow: { flexDirection: 'row', marginTop: 10 },
  statsText: { ...Typography.bodyRegular.small, color: t.textSecondary, marginTop: 8 },

  // settings list
  valueRowLabel: { ...Typography.bodyRegular.medium, color: t.textPrimary },
  valueRowValue: { ...Typography.bodyRegular.medium, color: t.textPrimary, opacity: 0.85 },
  valueRowChevron: { color: t.textPrimary, opacity: 0.6, marginLeft: 8 },
  leadingIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: t.surfaceAlt },
  leadingIconText: { ...Typography.bodyRegular.small, color: t.textPrimary },

  // destructive row
  destructiveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  destructiveLeft: { flexDirection: 'row', alignItems: 'center' },
  destructiveIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: t.surface },
  destructiveIconText: { ...Typography.bodyRegular.small, color: t.danger.normal },
  destructiveText: { ...Typography.bodyRegular.medium, color: t.danger.normal },

  spacer12: { height: 12 },
  spacer16: { height: 16 },
});
