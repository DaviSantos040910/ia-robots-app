import { StyleSheet } from "react-native";
import { ListTokens } from "../../theme/list";

export const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ListTokens.rowPaddingH,
    paddingVertical: 12,
  },
  right: {
    marginLeft: 14,
    flex: 1,
  },
  secondLine: {
    marginTop: 8,
  },
});
