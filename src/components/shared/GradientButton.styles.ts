import { StyleSheet } from "react-native";
import { Radius } from "../../theme/radius";
import { Typography } from "../../theme/typography";
import { NeutralColors } from "../../theme/neutralColors";

export const s = StyleSheet.create({
  innerWrap: {
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  gradient: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loading: {
    position: "absolute",
  },
  title: {
    ...Typography.bodySemiBold.large,
    color: NeutralColors.neutral.light.white1,
  },
});
