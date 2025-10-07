// src/screens/ChatList/ChatList.styles.ts
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
export type ChatListTheme = ReturnType<typeof getTheme>;

export const createChatListStyles = (t: ChatListTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },

  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing['spacing-group-s'], 
    paddingTop: Spacing['spacing-group-s'], 
    paddingBottom: Spacing['spacing-group-m'],
    backgroundColor: t.background,
  },
  headerTitle: { 
    ...Typography.titleSemiBold.extraLarge, 
    color: t.textPrimary, 
    fontSize: 26, 
    fontFamily: 'Inter_700Bold' 
  },
  
  // List Row Item
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: Spacing['spacing-group-s'], 
    paddingVertical: 12 
  },
  avatar: { 
    width: ListTokens.avatar, 
    height: ListTokens.avatar, 
    borderRadius: ListTokens.avatar / 2, 
    backgroundColor: t.surfaceAlt, 
    marginRight: 14 
  },
  body: { flex: 1 },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: { 
    ...Typography.titleSemiBold.medium, 
    color: t.textPrimary, 
    flexShrink: 1, // Prevent title from pushing date away
  },
  timestamp: {
    ...Typography.bodyRegular.small,
    color: t.textSecondary,
    marginLeft: 8,
  },
  lastMessage: { 
    ...Typography.bodyRegular.medium, 
    color: t.textSecondary,
    // Add ellipsizeMode to truncate long messages
    overflow: 'hidden',
  },
  
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.border,
    marginLeft: Spacing['spacing-group-s'] + ListTokens.avatar + 14,
  },

  // Empty state
  emptyWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: Spacing['spacing-group-m'],
  },
  emptyIcon: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: t.surfaceAlt, 
    marginBottom: 16 
  },
  emptyTitle: { 
    ...Typography.titleSemiBold.medium, 
    color: t.textPrimary,
    marginBottom: 6,
  },
  emptyDesc: { 
    ...Typography.bodyRegular.medium, 
    color: t.textSecondary, 
    textAlign: 'center' 
  },
});