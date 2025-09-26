
// src/components/shared/Motion.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type AnimatedViewStyle = StyleProp<ViewStyle> & {
  opacity?: Animated.Value | Animated.AnimatedInterpolation<number>;
  transform?: ({
    translateY?: Animated.Value | number;
    translateX?: Animated.Value | number;
    scale?: Animated.Value | number;
  })[];
};

export const useFadeSlideIn = (
  opts?: { delay?: number; dy?: number; duration?: number },
): AnimatedViewStyle => {
  const { delay = 0, dy = 12, duration = 320 } = opts || {};
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(dy)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, duration, opacity, translateY]);

  return useMemo(() => ({ opacity, transform: [{ translateY }] }), [opacity, translateY]);
};

export const useFadeScaleIn = (
  visible: boolean,
  opts?: { duration?: number; from?: number },
): AnimatedViewStyle => {
  const { duration = 180, from = 0.96 } = opts || {};
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(scale, { toValue: 1, duration, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: Math.max(1, duration - 40), useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
        Animated.timing(scale, { toValue: from, duration: Math.max(1, duration - 40), useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
      ]).start();
    }
  }, [visible, duration, from, opacity, scale]);

  return { opacity, transform: [{ scale }] };
};

export const useFadeScale = useFadeScaleIn;

export const ScalePressable: React.FC<
  PressableProps & { style?: StyleProp<ViewStyle> }
> = ({ children, style, ...rest }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 10 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style as any]}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} {...rest}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const useScaleOnPress = (opts?: { pressedScale?: number }) => {
  const pressedScale = opts?.pressedScale ?? 0.98;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: pressedScale, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 10 }).start();
  };

  const style: AnimatedViewStyle = { transform: [{ scale }] };
  return { onPressIn, onPressOut, style } as const;
};

export const smoothLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
