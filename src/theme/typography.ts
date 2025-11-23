// src/theme/typography.ts
// typography.ts - Figma typography scale

export const Typography = {
  bodySemiBold: {
    large: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'Inter_600SemiBold',
    },
    medium: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'Inter_600SemiBold',
    },
    small: {
      fontSize: 12,
      lineHeight: 20,
      fontFamily: 'Inter_600SemiBold',
    },
  },
  titleSemiBold: {
    extraLarge: {
      fontSize: 20,
      lineHeight: 28,
      fontFamily: 'Inter_600SemiBold',
    },
    large: {
      fontSize: 18,
      lineHeight: 26,
      fontFamily: 'Inter_600SemiBold',
    },
    medium: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'Inter_600SemiBold',
    },
  },
  // Adicionado Title3 conforme solicitado (estilo Apple HIG aproximado ou Figma)
  title3: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600' as const,
  },
  bodyMedium: {
    medium: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'Inter_500Medium',
    },
  },
  bodyRegular: {
    medium: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'Inter_400Regular',
    },
    small: {
      fontSize: 12,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
    },
  },
};