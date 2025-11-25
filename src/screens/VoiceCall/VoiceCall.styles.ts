import { StyleSheet, Platform } from 'react-native';
import { NeutralColors } from '../../theme/neutralColors';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';

export const getTheme = (isDark: boolean) => {
  const font = isDark
    ? { primary: NeutralColors.fontAndIcon.dark.wh1, secondary: NeutralColors.fontAndIcon.dark.wh2 }
    : NeutralColors.fontAndIcon.light;

  const background = isDark ? NeutralColors.neutral.dark.gray1 : NeutralColors.neutral.light.white1;
  const surfaceAlt = isDark ? NeutralColors.neutral.dark.gray2 : NeutralColors.neutral.light.gray1; // Usando gray1 para light mode ficar sutil
  const border = isDark ? NeutralColors.neutral.dark.gray3 : NeutralColors.neutral.light.gray4;

  return {
    isDark,
    background,
    surfaceAlt,
    border,
    textPrimary: (font as any).primary,
    textSecondary: (font as any).secondary,
    brand: { normal: Colors.brand.light.normal },
  } as const;
};

export type VoiceCallTheme = ReturnType<typeof getTheme>;

export const createVoiceCallStyles = (t: VoiceCallTheme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['spacing-layout-m'],
    paddingBottom: Spacing['spacing-layout-xl'],
  },
  avatarContainer: {
    width: 160,
    height: 160,
    borderRadius: 80, 
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: Spacing['spacing-layout-m'],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  botName: {
    ...Typography.title3, 
    textAlign: 'center',
    marginBottom: Spacing['spacing-element-xs'],
  },
  statusText: {
    ...Typography.bodyRegular.medium, 
    textAlign: 'center',
    marginTop: 4,
  },
  feedbackContainer: {
    marginTop: Spacing['spacing-layout-m'],
    paddingHorizontal: Spacing['spacing-group-m'],
    paddingVertical: Spacing['spacing-element-m'],
    borderRadius: 16,
    backgroundColor: t.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
  },
  feedbackText: {
    ...Typography.bodyRegular.medium,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['spacing-layout-xl'],
    paddingBottom: Spacing['spacing-layout-xl'],
    paddingTop: Spacing['spacing-layout-m'],
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  primaryButton: {
    width: 88, 
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});