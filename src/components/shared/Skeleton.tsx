import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle, type DimensionValue } from 'react-native';

export const SkeletonBlock: React.FC<{
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ width = '100%', height = 16, radius = 8, style }) => {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [v]);

  const translateX = v.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 200],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: '#ECECEC',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 40,
          transform: [{ translateX }],
          backgroundColor: '#F7F7F7',
          opacity: 0.6,
        }}
      />
    </View>
  );
};
