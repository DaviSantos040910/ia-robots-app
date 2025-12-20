import React from "react";
import { View } from "react-native";
import { createSectionCardStyles } from "./SectionCard.styles";

export const SectionCard: React.FC<{
  bg: string;
  border: string;
  radius: number;
  padding?: number;
  children: React.ReactNode;
}> = ({ bg, border, radius, padding = 16, children }) => {
  const s = createSectionCardStyles();
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: radius,
          padding,
        },
      ]}
    >
      {children}
    </View>
  );
};
