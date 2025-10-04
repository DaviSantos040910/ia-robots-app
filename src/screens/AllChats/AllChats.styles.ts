// src/screens/AllChats/AllChats.styles.ts
import { StyleSheet } from 'react-native';
import { NeutralColors } from '../../theme/neutralColors';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Radius } from '../../theme/radius';
import { Typography } from '../../theme/typography';
import { ListTokens } from '../../theme/list';

export const getTheme = (isDark: boolean) => {
  const font = isDark
    ? { primary: NeutralColors.fontAndIcon.dark.wh1, secondary: NeutralColors.fontAndIcon.dark.wh2, placeholder: NeutralColors.fontAndIcon.dark.wh3, disabled: NeutralColors.fontAndIcon.dark.wh4 }
    : (NeutralColors.fontAndIcon as any).light;

  const background = isDark ? NeutralColors.neutral.dark.gray1 : NeutralColors.neutral.light.white1;
  const surface = isDark ? NeutralColors.neutral.dark.gray2 : '#FFFFFF';
  const surfaceAlt = isDark ? NeutralColors.neutral.dark.gray3 : NeutralColors.neutral.light.gray2;
  const border = isDark ? NeutralColors.neutral.dark.gray3 : NeutralColors.neutral.light.gray3;

  return {
    isDark,
    background: surface,
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
export type AllChatsTheme = ReturnType<typeof getTheme>;

export const createAllChatsStyles = (t: AllChatsTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['spacing-group-s'], paddingTop: Spacing['spacing-group-s'], paddingBottom: Spacing['spacing-group-m'] },
  headerTitle: { ...Typography.titleSemiBold.extraLarge, color: t.textPrimary, fontSize: 26, fontFamily: 'Inter_700Bold' },
  plusBtn: { position: 'absolute', right: Spacing['spacing-group-s'], top: Spacing['spacing-group-s'], width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surfaceAlt },
  
  // List Row Item
  rowPress: {},
  // AJUSTE: `paddingVertical` restaurado para o valor original para um espaçamento menor.
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing['spacing-group-s'], paddingVertical: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: t.surfaceAlt, marginRight: 14 },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' },
  title: { ...Typography.titleSemiBold.medium, color: t.textPrimary },
  officialBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: t.brand.surface },
  officialText: { ...Typography.bodyRegular.small, color: t.brand.normal, fontFamily: 'Inter_500Medium' },
  desc: { ...Typography.bodyRegular.medium, color: t.textSecondary, marginTop: 2 },
  
  // AJUSTE: Estilo do divisor para ser usado no ItemSeparatorComponent.
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.border,
    marginLeft: Spacing['spacing-group-s'] + 52 + 14,
    marginRight: Spacing['spacing-group-s'],
  },

  // Empty state
  emptyWrap: { paddingHorizontal: Spacing['spacing-group-s'] },
  emptyCard: { backgroundColor: t.surface, borderRadius: ListTokens.groupRadius, borderWidth: 0.5, borderColor: t.border, alignItems: 'center', justifyContent: 'center', paddingVertical: 28, paddingHorizontal: 16 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: t.surfaceAlt, marginBottom: 12 },
  emptyTitle: { ...Typography.titleSemiBold.medium, color: t.textPrimary },
  emptyDesc: { ...Typography.bodyRegular.small, color: t.textSecondary, textAlign: 'center', marginTop: 6 },
  emptyBtn: { marginTop: 14, backgroundColor: Colors.brand.light.normal, borderRadius: Radius.extraLarge, paddingVertical: 12, paddingHorizontal: 16 },
  emptyBtnText: { ...Typography.bodySemiBold.medium, color: '#fff' },

  // Skeleton group
  skWrap: { paddingHorizontal: Spacing['spacing-group-s'] },
});