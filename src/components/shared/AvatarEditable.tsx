
import React from 'react';
import { Animated, View, Text } from 'react-native';
import { createCreateBotStyles, getTheme } from '../../screens/CreateBot/CreateBot.styles';
import { useColorScheme } from 'react-native';
import { useFadeSlideIn } from './Motion';

export const AvatarEditable: React.FC<{ size?: number }> = ({ size = 96 }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createCreateBotStyles(t);
  const anim = useFadeSlideIn({ dy: 8, duration: 340 });
  const radius = size / 2;
  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, anim]}>
      <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.textSecondary }}>IMG</Text>
      </View>
    </Animated.View>
  );
};
