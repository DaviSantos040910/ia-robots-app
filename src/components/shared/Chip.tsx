import React from "react";
import { View, Text } from "react-native";
import { Typography } from "../../theme/typography";
import { s } from "./Chip.styles";
import { useTheme } from "../../theme/colors";

export const Chip: React.FC<{ label: string; bg?: string; fg?: string }> = ({
  label,
  bg,
  fg,
}) => {
  const theme = useTheme();
  const backgroundColor = bg ?? theme.brand.surface;
  const color = fg ?? theme.brand.normal;

  return (
    <View style={[s.wrap, { backgroundColor }]}>
      <Text style={[Typography.presets.label, { color }]}>{label}</Text>
    </View>
  );
};
