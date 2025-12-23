// src/theme/colors.ts
// colors.ts - Figma color palette
import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { NeutralColors } from "./neutralColors";

export const Colors = {
  semantic: {
    error: {
      normal: "#DC2626",
      light: "#FEE2E2",
      dark: "#B91C1C",
    },
    success: {
      normal: "#059669",
      light: "#D1FAE5",
      dark: "#047857",
    },
    warning: {
      normal: "#D97706",
      light: "#FFFBEB",
      dark: "#B45309",
    },
    info: {
      normal: "#2563EB",
      light: "#DBEAFE",
      dark: "#1D4ED8",
    },
    organization: {
      indigo: {
        normal: "#4F46E5",
        light: "#E0E7FF",
        dark: "#3730A3",
      },
      teal: {
        normal: "#0F766E",
        light: "#CCFBF1",
        dark: "#115E59",
      },
      amber: {
        normal: "#B45309",
        light: "#FEF3C7",
        dark: "#92400E",
      },
      rose: {
        normal: "#E11D48",
        light: "#FFE4E6",
        dark: "#9F1239",
      },
      sky: {
        normal: "#0284C7",
        light: "#E0F2FE",
        dark: "#075985",
      },
      violet: {
        normal: "#7C3AED",
        light: "#EDE9FE",
        dark: "#5B21B6",
      },
    },
  },
  brand: {
    light: {
      normal: "#4F46E5", // Indigo 600 - Primary Brand Color
      surface: "#F3F4F6", // Gray 100 for subtle surfaces
      background: "#FFFFFF", // Pure White for clean look (NotebookLM style)
      light: "#E0E7FF",
      dark: "#3730A3",
    },
    dark: {
      normal: "#818CF8",
      surface: "#1E1B4B",
      background: "#0B1220",
      light: "#C7D2FE",
      dark: "#6366F1",
    },
  },
  secondary: {
    light: {
      normal1: "#0F766E",
      normal2: "#14B8A6",
      background: "#CCFBF1",
    },
    dark: {
      normal1: "#2DD4BF",
      normal2: "#5EEAD4",
      background: "#0F3B39",
    },
  },
  noEmotion: {
    light: ["#ECF3FE", "#D0E0FE", "#B4CAFA", "#447CCD", "#1566DA", "#1258F7"],
    dark: ["#203EDA", "#E14DFF", "#F95509", "#F97010", "#F96C16", "#D84523"],
  },
  danger: {
    light: ["#FDF2F2", "#FDDADA", "#FB8089", "#F87010", "#F96C16", "#D84523"],
    dark: ["#563330", "#803635", "#B14347", "#DB404A", "#F70005", "#FFA198"],
  },
  success: {
    light: ["#F7FAF8", "#DDEEEB", "#B7E8CE", "#60CD8A", "#42BB68", "#34A472"],
    dark: ["#34A447", "#34AE65", "#26B690", "#45AA77", "#65BB62"],
  },
  warning: {
    light: ["#FFFBEB", "#FFEBC7", "#FFDFAA", "#FB8000", "#FB8000", "#EB9000"],
    dark: ["#543529", "#805027", "#BF6210", "#DB704A", "#EA8517", "#FAC520"],
  },
};

const getFontColors = (isDark: boolean) => {
  if (isDark) {
    return {
      primary: NeutralColors.fontAndIcon.dark.wh1,
      secondary: NeutralColors.fontAndIcon.dark.wh2,
      placeholder: NeutralColors.fontAndIcon.dark.wh3,
      disabled: NeutralColors.fontAndIcon.dark.wh4,
    } as const;
  }

  return {
    ...NeutralColors.fontAndIcon.light,
    // Ensure primary text is strong black for light mode
    primary: '#111827', // Gray 900
    secondary: '#6B7280', // Gray 500
  } as const;
};

export const getTheme = (isDark: boolean) => {
  const font = getFontColors(isDark);
  // NotebookLM Style: Clean White Background
  const background = isDark ? Colors.brand.dark.background : Colors.brand.light.background;
  const surface = isDark ? Colors.brand.dark.surface : "#FFFFFF";
  const surfaceAlt = isDark ? "#16213A" : "#F3F4F6"; // Gray 100
  const border = isDark ? "#233055" : "#E5E7EB"; // Gray 200

  const brandPalette = isDark ? Colors.brand.dark : Colors.brand.light;

  return {
    isDark,
    background,
    surface,
    surfaceAlt,
    border,
    textPrimary: font.primary,
    textSecondary: font.secondary,
    placeholder: font.placeholder,
    disabled: font.disabled,
    brand: {
      normal: brandPalette.normal,
      surface: brandPalette.surface,
      background: brandPalette.background,
      light: brandPalette.light,
      dark: brandPalette.dark,
      border,
      text: font.primary,
      textSecondary: font.secondary,
      primary: brandPalette.normal,
    },
  } as const;
};

export type AppTheme = ReturnType<typeof getTheme>;

export const useTheme = (): AppTheme => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return useMemo(() => getTheme(isDark), [isDark]);
};
