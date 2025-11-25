// src/screens/Chat/Chat.styles.ts

import { StyleSheet, Platform } from "react-native";
import { Colors } from "../../theme/colors";
import { NeutralColors } from "../../theme/neutralColors";
import { Spacing } from "../../theme/spacing";
import { Radius } from "../../theme/radius";
import { Typography } from "../../theme/typography";

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
    screen: { flex: 1, backgroundColor: t.background },
    content: { flex: 1, backgroundColor: t.background },
    listContent: { paddingHorizontal: Spacing["spacing-group-s"] },

    heroContainer: {
      alignItems: "center",
      marginTop: Spacing["spacing-group-l"],
      marginBottom: Spacing["spacing-group-m"],
    },

    heroAvatarRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: t.surface,
      alignItems: "center",
      justifyContent: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      marginBottom: Spacing["spacing-element-l"],
    },

    heroAvatarImage: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: t.surfaceAlt,
    },

    welcomeBubble: {
      backgroundColor: t.surface,
      borderRadius: Radius.xLarge,
      paddingHorizontal: Spacing["spacing-group-s"],
      paddingVertical: Spacing["spacing-element-l"],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      maxWidth: "90%",
      alignSelf: "flex-start",
      marginTop: 0,
      marginLeft: Spacing["spacing-group-s"],
      marginBottom: Spacing["spacing-group-m"],
      borderTopLeftRadius: Radius.small,
    },

    bubbleText: { ...Typography.bodyRegular.medium, color: t.textPrimary },
    userText: { ...Typography.bodyRegular.medium, color: "#FFFFFF" },

    readMore: {
      ...Typography.bodyRegular.medium,
      color: t.brand.normal,
      textDecorationLine: "underline",
    },

    rowLeft: {
      flexDirection: "row",
      justifyContent: "flex-start",
      width: "100%",
    },
    rowRight: {
      flexDirection: "row",
      justifyContent: "flex-end",
      width: "100%",
    },
    bubbleContainer: { marginBottom: 12, maxWidth: "85%" },

    bubbleBot: {
      backgroundColor: t.surface,
      borderRadius: Radius.xLarge,
      paddingHorizontal: Spacing["spacing-group-s"],
      paddingVertical: Spacing["spacing-element-l"],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      borderTopLeftRadius: Radius.small,
    },

    bubbleUser: {
      backgroundColor: t.brand.normal,
      borderRadius: Radius.xLarge,
      paddingHorizontal: Spacing["spacing-group-s"],
      paddingVertical: Spacing["spacing-element-l"],
      borderTopRightRadius: Radius.small,
    },

    bubbleDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.border,
      marginTop: 10,
      marginBottom: 4,
    },

    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 8,
    },

    leftActions: { flexDirection: "row", alignItems: "center" },
    rightActions: { flexDirection: "row", alignItems: "center" },
    actionButton: { paddingHorizontal: 10, paddingVertical: 8 },

    actionButtonFilled: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: t.brand.surface,
    },

    actionIcon: { color: t.textSecondary },
    actionIconFilled: { color: t.brand.normal },

    chipStack: {
      marginTop: 24,
      width: "100%",
      alignItems: "flex-start",
      paddingHorizontal: Spacing["spacing-group-s"],
    },

    chipItem: { marginBottom: 16 },

    chip: {
      backgroundColor: t.surface,
      borderRadius: Radius.extraLarge,
      paddingHorizontal: Spacing["spacing-group-s"],
      paddingVertical: Spacing["spacing-element-l"],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        },
        android: {
          elevation: 2,
        },
      }),
      marginBottom: Spacing["spacing-element-l"],
    },

    chipText: { ...Typography.bodyMedium.medium, color: t.textPrimary },

    miniSuggestionRow: {
      width: "100%",
      flexDirection: "column",
      alignItems: "flex-start",
      marginTop: 12,
    },

    miniChip: {
      backgroundColor: "transparent",
      borderRadius: Radius.extraLarge,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      marginBottom: 8,
    },

    miniChipText: { ...Typography.bodyRegular.small, color: t.textPrimary },

    inputWrap: {
      paddingHorizontal: Spacing["spacing-element-m"],
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: t.background,
    },

    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.surface,
      borderRadius: Radius.round,
      paddingHorizontal: Spacing["spacing-element-m"],
      paddingVertical: Spacing["spacing-element-l"],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
    },

    textInput: {
      flex: 1,
      ...Typography.bodyRegular.medium,
      color: t.textPrimary,
      paddingTop: 0,
      paddingBottom: 0,
      marginLeft: 8,
    },

    placeholder: { color: t.placeholder },
    inputIcons: { flexDirection: "row", alignItems: "center" },

    plusButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.surface,
    },

    scrollToEndButton: {
      position: "absolute",
      bottom: 80,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },

    activateBanner: {
      paddingHorizontal: Spacing["spacing-element-m"],
      paddingVertical: Spacing["spacing-element-l"],
      backgroundColor: t.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
      alignItems: "center",
    },

    activateButton: {
      backgroundColor: t.brand.normal,
      paddingVertical: Spacing["spacing-element-m"],
      paddingHorizontal: Spacing["spacing-group-s"],
      borderRadius: Radius.large,
    },

    activateButtonText: {
      ...Typography.bodySemiBold.medium,
      color: "#FFFFFF",
    },

    // --- ESTILOS DE GRAVAÇÃO DE ÁUDIO ---
    recordingContainer: {
      backgroundColor: t.surfaceAlt,
      borderRadius: Radius.round,
      paddingHorizontal: Spacing["spacing-element-m"],
      paddingVertical: Spacing["spacing-element-l"],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing["spacing-element-s"],
    },

    recordingButton: {
      padding: Spacing["spacing-element-xs"],
    },

    recordingIndicator: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing["spacing-element-s"],
    },

    recordingDot: {
      width: 12,
      height: 12,
      borderRadius: Radius.circle,
      backgroundColor: Colors.semantic.error.normal,
      opacity: 0.3,
    },

    recordingDotActive: {
      opacity: 1,
    },

    recordingDuration: {
      ...Typography.bodyRegular.medium,
      color: t.textPrimary,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },

    recordingText: {
      ...Typography.bodyRegular.medium,
      color: t.textSecondary,
      marginLeft: Spacing["spacing-element-s"],
    },

    // --- ESTILOS DO AUDIO PLAYER ---
    audioPlayerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        minWidth: 220,
    },
    audioPlayButton: {
        paddingRight: Spacing['spacing-element-m'],
    },
    audioProgressContainer: {
        flex: 1,
        height: 30, 
        justifyContent: 'center',
        marginRight: Spacing['spacing-element-m'],
    },
    audioTrack: {
        height: 4,
        borderRadius: 2,
        width: '100%',
        position: 'relative',
        overflow: 'visible',
    },
    audioFill: {
        height: '100%',
        borderRadius: 2,
    },
    audioThumb: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        top: -4,
        marginLeft: -6,
    },
    audioSeekTouchArea: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    audioDurationText: {
        ...Typography.bodyRegular.small,
        fontVariant: ['tabular-nums'],
        minWidth: 35,
        textAlign: 'right',
    },

    // --- ESTILOS DE ANEXOS (MessageBubble) ---
    attachmentContainer: {
        marginTop: Spacing['spacing-element-s'],
        borderRadius: Radius.medium,
        overflow: 'hidden',
        minWidth: 200,
    },
    attachmentImage: {
        width: 220,
        height: 220,
        borderRadius: Radius.medium,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    attachmentLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Radius.medium,
    },
    attachmentDocument: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing['spacing-element-l'],
        borderRadius: Radius.medium,
        borderWidth: StyleSheet.hairlineWidth,
        width: 220,
    },
    attachmentDocumentText: {
        ...Typography.bodyRegular.medium,
    },
    transcriptionToggle: {
        marginTop: 4,
    },
    transcriptionText: {
        marginTop: 8,
        marginBottom: 4, 
        opacity: 0.9, 
        fontSize: 14
    }
  });