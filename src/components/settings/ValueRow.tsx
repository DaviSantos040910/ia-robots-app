
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Typography } from '../../theme/typography';

export const ValueRow: React.FC<{ label: string; value: string; color: string; onPress?: () => void }>
= ({ label, value, color, onPress }) => (
  <Pressable onPress={onPress} disabled={!onPress} style={{ paddingVertical: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ ...Typography.bodyRegular.medium, color }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ ...Typography.bodyRegular.medium, color, opacity: 0.85 }}>{value}</Text>
        <Text style={{ marginLeft: 8, color, opacity: 0.6 }}>›</Text>
      </View>
    </View>
  </Pressable>
);
