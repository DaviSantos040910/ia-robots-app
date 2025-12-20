import React from "react";
import { View } from "react-native";
import { s } from "./Divider.styles";

export const Divider: React.FC<{ color: string }> = ({ color }) => (
  <View style={[s.divider, { backgroundColor: color }]} />
);
