// src/theme/typography.ts
export const Typography = {
  weights: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  sizes: {
    xxs: 11,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  presets: {
    // Headings
    heading1: {
      fontSize: 32,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 40,
      letterSpacing: -1,
    },
    heading2: {
      fontSize: 24,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    heading3: {
      fontSize: 20,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 28,
    },

    // Body Text
    bodyLarge: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      lineHeight: 24,
    },
    bodyRegular: {
      medium: {
        fontSize: 14,
        fontFamily: "Inter_500Medium",
        lineHeight: 20,
      },
      regular: {
        fontSize: 14,
        fontFamily: "Inter_400Regular",
        lineHeight: 20,
      },
      small: {
        fontSize: 12,
        fontFamily: "Inter_400Regular",
        lineHeight: 16,
      },
    },

    // UI Elements
    button: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    caption: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      lineHeight: 16,
      letterSpacing: 0.2,
    },
    label: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
    },
  },

  // Legacy Support (Mapping old names to new structure if needed, or keeping them)
  bodyMedium: {
    medium: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      lineHeight: 20,
    },
  },

  // Additional typography presets for compatibility
  titleSemiBold: {
    extraLarge: {
      fontSize: 24,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 32,
    },
    large: {
      fontSize: 20,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 28,
    },
    medium: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 20,
    },
  },

  bodyRegular: {
    medium: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      lineHeight: 20,
    },
    regular: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      lineHeight: 16,
    },
  },

  bodySemiBold: {
    large: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 24,
    },
    medium: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      lineHeight: 16,
    },
  },

  // Additional compatibility typography presets
  title3: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 28,
  },

  bodySmall: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },

  body: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
} as const;
