import { StyleSheet } from "react-native";
import { Spacing } from "../../theme/spacing";
import { NeutralColors } from "../../theme/neutralColors";
import { Typography } from "../../theme/typography";
import type { ChatTheme } from "../../screens/Chat/Chat.styles";

export const createMessageBubbleStyles = (t: ChatTheme) =>
  StyleSheet.create({
    audioWrap: {
      marginBottom: Spacing["spacing-element-m"],
    },
    readMorePressable: {
      marginTop: Spacing["spacing-element-xs"],
    },
    attachmentIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing["spacing-element-m"],
    },
    attachmentRight: {
      flex: 1,
    },
    transcriptionLinkText: {
      ...Typography.bodyRegular.small,
      textDecorationLine: "underline",
    },
    userOnDarkText: {
      color: NeutralColors.neutral.light.white1,
    },
  });
