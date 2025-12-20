import React from "react";
import { Animated, View, Text } from "react-native";
import { useTheme } from "../../theme/colors";
import { useFadeSlideIn } from "./Motion";
import { s } from "./AvatarEditable.styles";

export const AvatarEditable: React.FC<{ size?: number }> = ({ size = 96 }) => {
  const t = useTheme();
  const anim = useFadeSlideIn({ dy: 8, duration: 340 });
  const radius = size / 2;
  return (
    <Animated.View style={[s.root, anim]}>
      <View
        style={[
          s.avatar,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: t.surface,
            borderColor: t.border,
          },
        ]}
      >
        <Text style={s.text}>IMG</Text>
      </View>
    </Animated.View>
  );
};
