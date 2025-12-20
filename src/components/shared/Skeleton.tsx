import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  View,
  type StyleProp,
  type ViewStyle,
  type DimensionValue,
} from "react-native";
import { s } from "./Skeleton.styles";

export const SkeletonBlock: React.FC<{
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ width = "100%", height = 16, radius = 8, style }) => {
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
    <View style={[s.blockBase, { width, height, borderRadius: radius }, style]}>
      <Animated.View style={[s.shimmer, { transform: [{ translateX }] }]} />
    </View>
  );
};
