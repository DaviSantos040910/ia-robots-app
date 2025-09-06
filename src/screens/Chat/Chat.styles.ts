
import { StyleSheet, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import { NeutralColors } from '../../theme/neutralColors';
import { Spacing } from '../../theme/spacing';
import { Radius } from '../../theme/radius';
import { Typography } from '../../theme/typography';

const getFontColors = (isDark: boolean) => {
  if (isDark) {
    return {
      primary: NeutralColors.fontAndIcon.dark.wh1,
      secondary: NeutralColors.fontAndIcon.dark.wh2,
      placeholder: NeutralColors.fontAndIcon.dark.wh3,
      disabled: NeutralColors.fontAndIcon.dark.wh4,
    } as const;
  }
  return NeutralColors.fontAndIcon.light as any;
};

export const getTheme = (isDark: boolean) => {
  const font = getFontColors(isDark);
  const background = isDark ? NeutralColors.neutral.dark.gray1 : NeutralColors.neutral.light.gray1;
  const surface = isDark ? NeutralColors.neutral.dark.gray2 : NeutralColors.neutral.light.white1;
  const surfaceAlt = isDark ? NeutralColors.neutral.dark.gray3 : NeutralColors.neutral.light.gray2;
  const border = isDark ? NeutralColors.neutral.dark.gray3 : NeutralColors.neutral.light.gray3;
  const brandNormal = Colors.brand.light.normal;
  const brandSurface = Colors.brand.light.surface;
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
    brand: { normal: brandNormal, surface: brandSurface },
  } as const;
};
export type ChatTheme = ReturnType<typeof getTheme>;

export const createChatStyles = (t: ChatTheme) =>
  StyleSheet.create({
    // Layout base
    screen: { flex: 1, backgroundColor: t.background },
    content: { flex: 1, backgroundColor: t.background },
    listContent: {
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingTop: Spacing['spacing-card-m'],
      paddingBottom: Spacing['spacing-card-l'],
    },

    // Header
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingVertical: Spacing['spacing-element-l'],
      backgroundColor: t.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    backButton: { width: 28, height: 28, borderRadius: Radius.round, alignItems: 'center', justifyContent: 'center', marginRight: Spacing['spacing-group-s'] },
    tinyAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.surfaceAlt, marginRight: Spacing['spacing-group-s'] },
    titleArea: { flex: 1 },
    title: { ...Typography.titleSemiBold.medium, color: t.textPrimary },
    subtitle: { ...Typography.bodyRegular.small, color: t.textSecondary },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    mlIcon: { marginLeft: Spacing['spacing-group-s'] },

    // Hero / Welcome
    heroContainer: { alignItems: 'center', marginBottom: Spacing['spacing-card-l'] },
    heroAvatarRing: { width: 184, height: 184, borderRadius: 92, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' },
    heroAvatar: { width: 168, height: 168, borderRadius: 84, backgroundColor: t.surfaceAlt },
    welcomeBubble: { backgroundColor: t.surface, borderRadius: Radius.extraLarge, paddingHorizontal: Spacing['spacing-group-s'], paddingVertical: Spacing['spacing-element-l'], borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, maxWidth: '90%', alignSelf: 'center', marginTop: Spacing['spacing-group-m'] },

    // Bubbles
    rowLeft: { flexDirection: 'row', justifyContent: 'flex-start', width: '100%' },
    rowRight: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%' },
    bubbleContainer: { marginBottom: Spacing['spacing-element-l'], maxWidth: '85%' },
    bubbleBot: {
      backgroundColor: t.surface,
      borderRadius: Radius.extraLarge,
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingVertical: Spacing['spacing-element-l'],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    bubbleUser: {
      backgroundColor: t.brand.normal,
      borderRadius: Radius.extraLarge,
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingVertical: Spacing['spacing-element-l'],
    },
    bubbleText: { ...Typography.bodyRegular.medium, color: t.textPrimary },
    userText: { ...Typography.bodyRegular.medium, color: '#FFFFFF' },

    // Action bar
    bubbleDivider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginTop: Spacing['spacing-element-m'] },
    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing['spacing-element-m'] },
    leftActions: { flexDirection: 'row', alignItems: 'center' },
    rightActions: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: t.brand.surface, marginRight: Spacing['spacing-element-m'] },
    actionButtonFilled: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: t.brand.normal },
    actionIcon: { ...Typography.bodyMedium.medium, color: t.brand.normal },
    actionIconFilled: { ...Typography.bodyMedium.medium, color: '#FFFFFF' },

    // Large suggestion chips (header intro)
    chip: {
      backgroundColor: t.surface,
      borderRadius: Radius.extraLarge,
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingVertical: Spacing['spacing-element-l'],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
        android: { elevation: 1 },
      }),
    },
    chipText: { ...Typography.bodyMedium.medium, color: t.textPrimary },
    chipStack: { marginTop: Spacing['spacing-element-l'], width: '100%' },
    chipItem: { marginBottom: Spacing['spacing-group-s'], alignSelf: 'flex-start' },

    // Inline mini suggestions (below assistant bubble)
    miniSuggestionRow: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing['spacing-element-m'] },
    miniChip: {
      backgroundColor: t.surface,
      borderRadius: Radius.extraLarge,
      paddingHorizontal: Spacing['spacing-element-l'],
      paddingVertical: Spacing['spacing-element-s'],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      marginRight: Spacing['spacing-element-m'],
      marginBottom: Spacing['spacing-element-m'],
    },
    miniChipText: { ...Typography.bodyRegular.small, color: t.textPrimary },

    // Input
    inputWrap: { paddingHorizontal: Spacing['spacing-group-s'], paddingTop: Spacing['spacing-element-m'], paddingBottom: Spacing['spacing-element-m'], backgroundColor: 'transparent' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: Radius.round, paddingHorizontal: Spacing['spacing-group-s'], paddingVertical: Spacing['spacing-element-l'], borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    textInput: { flex: 1, ...Typography.bodyRegular.medium, color: t.textPrimary, paddingTop: 0, paddingBottom: 0 },
    placeholder: { color: t.placeholder },
    inputIcons: { flexDirection: 'row', alignItems: 'center' },
    plusButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  });
