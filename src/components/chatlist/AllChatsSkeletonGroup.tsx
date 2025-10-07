// src/components/allchats/AllChatsSkeletonGroup.tsx
import React from "react";
import { View } from "react-native";
import { useColorScheme } from "react-native";
import { SkeletonBlock } from "../shared/Skeleton";
import {
  createAllChatsStyles,
  getTheme,
} from "../../screens/ChatList/ChatList.styles";
import { ListTokens } from "../../theme/list";

const SkeletonRow: React.FC = () => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === "dark");
  const s = createAllChatsStyles(t);
  return (
    // The divider is now part of the row itself for proper spacing.
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: ListTokens.rowPaddingH,
          paddingVertical: 12,
        }}
      >
        <SkeletonBlock
          width={ListTokens.avatar}
          height={ListTokens.avatar}
          radius={ListTokens.avatar / 2}
        />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <SkeletonBlock width={"60%"} height={16} radius={6} />
          <SkeletonBlock
            width={"90%"}
            height={12}
            radius={6}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </View>
  );
};

export const AllChatsSkeletonGroup: React.FC<{ count?: number }> = ({
  count = 8,
}) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === "dark");
  const s = createAllChatsStyles(t);
  const items = Array.from({ length: count });
  return (
    <View style={s.skWrap}>
      {/* CORREÇÃO: Removido o <View> com o estilo `s.skGroup` que não existe mais. */}
      {items.map((_, i) => (
        <View key={i}>
          <SkeletonRow />
          {/* Render the divider after each skeleton row, except the last one. */}
          {i < items.length - 1 && <View style={s.divider} />}
        </View>
      ))}
    </View>
  );
};
