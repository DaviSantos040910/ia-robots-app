import { StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { NeutralColors } from '../../theme/neutralColors';
import { Spacing } from '../../theme/spacing';
import { Radius } from '../../theme/radius';
import { Typography } from '../../theme/typography';

// Normaliza as cores de texto para que dark e light tenham as mesmas chaves
const getFontColors = (isDark: boolean) => {
  if (isDark) {
    return {
      primary: NeutralColors.fontAndIcon.dark.wh1,
      secondary: NeutralColors.fontAndIcon.dark.wh2,
      placeholder: NeutralColors.fontAndIcon.dark.wh3,
      disabled: NeutralColors.fontAndIcon.dark.wh4,
    };
  }
  return NeutralColors.fontAndIcon.light;
};

export const getTheme = (isDark: boolean) => {
  const font = getFontColors(isDark);

  // Acesse explicitamente light / dark para evitar erros de união de tipos
  const background = isDark
    ? NeutralColors.neutral.dark.gray1
    : NeutralColors.neutral.light.gray1;

  const surface = isDark
    ? NeutralColors.neutral.dark.gray2
    : NeutralColors.neutral.light.white1;

  const surfaceAlt = isDark
    ? NeutralColors.neutral.dark.gray3
    : NeutralColors.neutral.light.gray2;

  const border = isDark
    ? NeutralColors.neutral.dark.gray3
    : NeutralColors.neutral.light.gray3;

  // Escolha das cores de marca — aqui mantive identidade similar entre temas,
  // mas você pode ajustar para Colors.brand.dark quando quiser.
  const brandNormal = Colors.brand.light.normal;
  const brandSurface = Colors.brand.light.surface;

  return {
    isDark,

    background, // page bg
    surface, // cards/bubbles
    surfaceAlt,
    border,

    textPrimary: font.primary,
    textSecondary: font.secondary,
    placeholder: font.placeholder,
    disabled: font.disabled,

    brand: {
      normal: brandNormal,
      surface: brandSurface,
    },
  } as const;
};

export type ChatTheme = ReturnType<typeof getTheme>;

export const createChatStyles = (t: ChatTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: t.background,
    },
    content: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingTop: Spacing['spacing-card-m'],
      paddingBottom: Spacing['spacing-card-xl'] + 64,
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      // OBS: React Native não suporta `gap`. Aplique margin nos filhos (ex.: marginRight)
      flex: 1,
    },
    backButton: {
      width: 28,
      height: 28,
      borderRadius: Radius.round,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tinyAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.surfaceAlt,
    },
    titleArea: {
      flex: 1,
    },
    title: {
      ...Typography.titleSemiBold.medium,
      color: t.textPrimary,
    },
    subtitle: {
      ...Typography.bodyRegular.small,
      color: t.textSecondary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      // OBS: remova `gap` — use style nos ícones (ex.: { marginLeft: spacing })
    },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Hero avatar (top of chat when empty)
    heroContainer: {
      alignItems: 'center',
      marginBottom: Spacing['spacing-card-l'],
    },
    heroAvatarRing: {
      width: 184,
      height: 184,
      borderRadius: 92,
      backgroundColor: t.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroAvatar: {
      width: 168,
      height: 168,
      borderRadius: 84,
      backgroundColor: t.surfaceAlt,
    },

    // Bubbles
    bubbleContainer: {
      marginBottom: Spacing['spacing-element-l'],
      maxWidth: '85%',
    },
    bubbleBot: {
      backgroundColor: t.surface,
      borderRadius: Radius.extraLarge,
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingVertical: Spacing['spacing-element-l'],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    bubbleUser: {
      backgroundColor: t.brand.surface,
      borderRadius: Radius.extraLarge,
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingVertical: Spacing['spacing-element-l'],
    },
    bubbleText: {
      ...Typography.bodyRegular.medium,
      color: t.textPrimary,
    },
    rowLeft: { flexDirection: 'row', justifyContent: 'flex-start' },
    rowRight: { flexDirection: 'row', justifyContent: 'flex-end' },

    // Suggestion chips
    chip: {
      backgroundColor: t.surface,
      borderRadius: Radius.extraLarge,
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingVertical: Spacing['spacing-element-l'],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },
    chipText: {
      ...Typography.bodyMedium.medium,
      color: t.textPrimary,
    },
    chipStack: {
      // OBS: remova `gap` — você pode aplicar marginRight/marginBottom nos chips filhos
      marginTop: Spacing['spacing-element-l'],
    },

    // Input
    inputWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingBottom: Spacing['spacing-card-s'], // safe-area handled pelo container pai
      backgroundColor: 'transparent',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surface,
      borderRadius: Radius.round,
      paddingHorizontal: Spacing['spacing-group-s'],
      paddingVertical: Spacing['spacing-element-l'],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      // OBS: remova `gap` — se precisar de espaçamento entre ícones, use margin nos ícones
    },
    textInput: {
      flex: 1,
      ...Typography.bodyRegular.medium,
      color: t.textPrimary,
    },
    placeholder: { color: t.placeholder },
    inputIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      // use margin nos filhos em vez de gap
    },
    plusButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceAlt,
    },
  });
