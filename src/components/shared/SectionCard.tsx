
import React from 'react';
import { View } from 'react-native';
export const SectionCard: React.FC<{ bg: string; border: string; radius: number; padding?: number; children: React.ReactNode }>
= ({ bg, border, radius, padding = 16, children }) => (
  <View style={{ backgroundColor: bg, borderWidth: 0.5, borderColor: border, borderRadius: radius, padding }}>{children}</View>
);
