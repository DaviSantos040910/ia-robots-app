// src/screens/BotSettings/BotSettings.styles.ts
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
  const border = isDark ? NeutralColors.neutral.dark.gray3 : NeutralColors.neutral.light.gray2;

  return {
    isDark,
    background,
    surface,
    border,
    textPrimary: (font as any).primary,
    textSecondary: (font as any).secondary,
    brand: { normal: Colors.brand.light.normal },
    danger: { normal: Colors.semantic.error.normal, light: Colors.semantic.error.light },
  } as const;
};
export type SettingsTheme = ReturnType<typeof getTheme>;

export const createBotSettingsStyles = (t: SettingsTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },
  content: { padding: Spacing['spacing-group-s'] },

  // Top navigation bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['spacing-element-m'], height: 56 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rightGroup: { flexDirection: 'row', alignItems: 'center' },

  // Main identity card
  identityCard: { backgroundColor: t.surface, borderRadius: Radius.xLarge, padding: Spacing['spacing-group-m'], alignItems: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: t.border, marginBottom: Spacing['spacing-element-l'] },
  title: { ...Typography.titleSemiBold.extraLarge, color: t.textPrimary, fontSize: 24, marginBottom: 2 },
  byline: { ...Typography.bodyRegular.medium, color: t.textSecondary, marginBottom: Spacing['spacing-element-l'] },
  chipRow: { flexDirection: 'row', marginBottom: Spacing['spacing-element-l'] },
  statsText: { ...Typography.bodyRegular.medium, color: t.textSecondary },

  // Settings section
  settingsCard: { backgroundColor: t.surface, borderRadius: Radius.xLarge, marginTop: Spacing['spacing-group-m'] },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: Spacing['spacing-group-s'] },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  settingIconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing['spacing-element-l'] },
  valueRowLabel: { ...Typography.bodyMedium.medium, color: t.textPrimary, fontSize: 16 },
  valueRowValue: { ...Typography.bodyRegular.medium, color: t.textSecondary },
  valueRowChevron: { color: t.textSecondary, opacity: 0.6, marginLeft: 8 },

  // Cleanup section
  cleanupCard: { backgroundColor: t.surface, borderRadius: Radius.xLarge, marginTop: Spacing['spacing-group-m'], overflow: 'hidden' },
  // AJUSTE: Garantido que `flexDirection` seja 'row' para alinhar itens lado a lado.
  destructiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing['spacing-group-s'],
  },
  destructiveIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Radius.round,
    backgroundColor: t.danger.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destructiveText: { ...Typography.bodyMedium.medium, color: t.danger.normal, fontSize: 16 },
  
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: Spacing['spacing-group-s'] + 40 + Spacing['spacing-element-l'] },
  spacer16: { height: 16 },
});