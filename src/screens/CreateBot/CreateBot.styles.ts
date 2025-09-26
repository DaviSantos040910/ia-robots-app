
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
export type CreateBotTheme = ReturnType<typeof getTheme>;

export const createCreateBotStyles = (t: CreateBotTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },

  // Top bar with centered title, close on left
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  topLeft: { width: 48, alignItems: 'flex-start', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRight: { width: 48 },
  closeText: { ...Typography.titleSemiBold.medium, color: t.textPrimary },
  titleText: { ...Typography.titleSemiBold.extraLarge, color: t.textPrimary },

  // Content
  content: { paddingHorizontal: 16, paddingBottom: 24 },

  // Avatar block
  avatarBlock: { alignItems: 'center', marginTop: 8, marginBottom: 16 },

  // Fields
  fieldBlock: { marginBottom: 14 },
  labelText: { ...Typography.bodyMedium.medium, color: t.textSecondary, marginBottom: 8 },
  inputBase: {
    backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border,
    borderRadius: Radius.extraLarge, paddingHorizontal: 14, paddingVertical: 12,
    color: t.textPrimary,
  },
  inputMultiline: {
    backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border,
    borderRadius: Radius.extraLarge, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12,
    minHeight: 120, textAlignVertical: 'top', color: t.textPrimary,
  },
  placeholder: { color: t.placeholder },

  // Setting rows
  card: { backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, borderRadius: Radius.extraLarge, paddingHorizontal: 12, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  leadingIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surfaceAlt, marginRight: 10 },
  leadingIconText: { ...Typography.bodyRegular.small, color: t.textPrimary },
  rowLabel: { ...Typography.bodyRegular.medium, color: t.textPrimary },
  rowValue: { ...Typography.bodyRegular.medium, color: t.textSecondary },
  chevron: { ...Typography.bodyRegular.medium, color: t.textSecondary, marginLeft: 8 },
  divider: { height: 0.5, backgroundColor: t.border, width: '100%' },

  // Create button footer
  footer: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16 },
  cta: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: Radius.extraLarge, backgroundColor: t.brand.normal },
  ctaText: { ...Typography.bodySemiBold.medium, color: '#fff' },
});
