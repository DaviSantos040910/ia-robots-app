import React from "react";
import { View, Text, Pressable } from "react-native";
import { useColorScheme } from "react-native";
import {
  createAllChatsStyles,
  getTheme,
} from "../../screens/ChatList/ChatList.styles";

export const AllChatsEmptyState: React.FC<{ onCreate: () => void }> = ({
  onCreate,
}) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === "dark");
  const s = createAllChatsStyles(t);
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyCard}>
        <View style={s.emptyIcon} />
        <Text style={s.emptyTitle}>Nenhum chat ainda</Text>
        <Text style={s.emptyDesc}>
          Crie seu primeiro bot para começar uma nova conversa.
        </Text>
        <Pressable onPress={onCreate} style={s.emptyBtn}>
          <Text style={s.emptyBtnText}>Criar bot</Text>
        </Pressable>
      </View>
    </View>
  );
};
