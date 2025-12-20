export const Typography = {
  weights: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    bold: "Inter_600SemiBold",
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  presets: {
    heading1: {
      fontSize: 32,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 40,
      letterSpacing: -1,
    },
    heading2: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 22,
      letterSpacing: -0.5,
    },
    heading3: {
      fontSize: 20,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
    },
    label: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
    },
  },

  bodyRegular: {
    medium: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: "Inter_400Regular",
    },
    small: {
      fontSize: 12,
      lineHeight: 20,
      fontFamily: "Inter_400Regular",
    },
  },
  bodyMedium: {
    medium: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: "Inter_500Medium",
    },
  },
  bodySemiBold: {
    large: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: "Inter_600SemiBold",
    },
    medium: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: "Inter_600SemiBold",
    },
    small: {
      fontSize: 12,
      lineHeight: 20,
      fontFamily: "Inter_600SemiBold",
    },
  },
  titleSemiBold: {
    extraLarge: {
      fontSize: 20,
      lineHeight: 28,
      fontFamily: "Inter_600SemiBold",
    },
    large: {
      fontSize: 18,
      lineHeight: 26,
      fontFamily: "Inter_600SemiBold",
    },
    medium: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: "Inter_600SemiBold",
    },
  },
  title3: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
} as const;

export const typography = {
  h4: Typography.presets.heading2,
  h6: Typography.presets.heading3,
  subtitle1: Typography.presets.heading3,
  body2: Typography.presets.bodySmall,
  caption: Typography.presets.label,
} as const;
