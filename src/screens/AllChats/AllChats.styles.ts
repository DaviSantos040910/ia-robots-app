
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
export type AllChatsTheme = ReturnType<typeof getTheme>;

export const createAllChatsStyles = (t: AllChatsTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing['spacing-group-s'], paddingTop: Spacing['spacing-element-l'], paddingBottom: Spacing['spacing-element-l'], backgroundColor: t.background },
  headerSide: { width: 36, alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...Typography.titleSemiBold.medium, color: t.textPrimary },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  headerIconText: { ...Typography.bodyRegular.medium, color: t.textPrimary },

  // List
  listContent: { paddingHorizontal: Spacing['spacing-group-s'], paddingBottom: Spacing['spacing-group-l'] },

  // Card
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, borderRadius: Radius.extraLarge, padding: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: t.surfaceAlt, marginRight: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { ...Typography.bodySemiBold.medium, color: t.textPrimary },
  officialBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: t.brand.surface },
  officialText: { ...Typography.bodyRegular.small, color: t.brand.normal },
  cardDesc: { ...Typography.bodyRegular.small, color: t.textSecondary, marginTop: 4 },

  // Bottom nav
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['spacing-group-s'], paddingTop: 8, paddingBottom: 10, backgroundColor: t.surface, borderTopWidth: 0.5, borderColor: t.border },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  navIconText: { ...Typography.bodyRegular.medium, color: t.textSecondary },
  navIconActive: { ...Typography.bodyRegular.medium, color: t.textPrimary },
  navLabel: { ...Typography.bodyRegular.small, marginTop: 2, color: t.textSecondary },
  navLabelActive: { ...Typography.bodyRegular.small, marginTop: 2, color: t.textPrimary },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#E5484D', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { ...Typography.bodyRegular.small, color: '#fff', fontSize: 10, lineHeight: 12 },
});
