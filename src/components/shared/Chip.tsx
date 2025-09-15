
import React from 'react';
import { View, Text } from 'react-native';
import { Typography } from '../../theme/typography';

export const Chip: React.FC<{ label: string; bg: string; fg: string }>= ({ label, bg, fg }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8 }}>
    <Text style={{ ...Typography.bodyRegular.small, color: fg }}>{label}</Text>
  </View>
);
