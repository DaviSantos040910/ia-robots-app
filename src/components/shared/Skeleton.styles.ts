import { StyleSheet } from "react-native";
import { NeutralColors } from "../../theme/neutralColors";

export const s = StyleSheet.create({
  blockBase: {
    overflow: "hidden",
    backgroundColor: NeutralColors.neutral.light.gray2,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: NeutralColors.neutral.light.gray1,
    opacity: 0.6,
  },
});
