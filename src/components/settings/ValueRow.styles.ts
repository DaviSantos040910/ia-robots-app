import { StyleSheet } from "react-native";
import { Typography } from "../../theme/typography";

export const createValueRowStyles = () =>
  StyleSheet.create({
    pressable: {
      paddingVertical: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingRight: 12,
    },
    label: {
      ...Typography.bodyRegular.medium,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
    },
    value: {
      ...Typography.bodyRegular.medium,
      opacity: 0.85,
    },
    chevron: {
      marginLeft: 8,
      opacity: 0.6,
    },
    chevronPressable: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
