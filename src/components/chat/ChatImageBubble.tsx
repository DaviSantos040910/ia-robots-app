import React, { useState } from "react";
import {
  View,
  Image,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { useColorScheme } from "react-native";
import { Radius } from "../../theme/radius";
import { Colors } from "../../theme/colors";
import { NeutralColors } from "../../theme/neutralColors";

type Props = {
  uri: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export const ChatImageBubble: React.FC<Props> = ({ uri, onPress, style }) => {
  const [isLoading, setIsLoading] = useState(true);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        style,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator
            size="small"
            color={NeutralColors.neutral.light.white1}
          />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    width: 240,
    height: 240,
    backgroundColor: "rgba(0,0,0,0.05)", // Placeholder background
    marginVertical: 4,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});
