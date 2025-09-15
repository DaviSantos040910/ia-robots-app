
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
  } as const;
};
export type SettingsTheme = ReturnType<typeof getTheme>;

export const createBotSettingsStyles = (t: SettingsTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: t.surface, borderBottomWidth: 0.5, borderColor: t.border },
  headerBackText: { fontSize: 18, color: t.textPrimary },
  headerTitle: { ...Typography.bodySemiBold.medium, color: t.textPrimary },

  content: { padding: Spacing['spacing-group-s'], paddingBottom: 24 },

  identityRow: { flexDirection: 'row' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: t.surfaceAlt, marginRight: 12 },
  title: { ...Typography.titleSemiBold.medium, color: t.textPrimary },
  byline: { ...Typography.bodyRegular.small, color: t.textSecondary },
  chipRow: { flexDirection: 'row', marginTop: 10 },
  statsText: { ...Typography.bodyRegular.small, color: t.textSecondary, marginTop: 8 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },

  dangerButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: Radius.extraLarge, backgroundColor: Colors.semantic.error.normal },
  dangerButtonText: { color: '#fff', fontWeight: '600' },

  spacer16: { height: 16 },
});
