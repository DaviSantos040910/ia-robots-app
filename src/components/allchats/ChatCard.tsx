
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { createAllChatsStyles, type AllChatsTheme } from '../../screens/AllChats/AllChats.styles';
import { useColorScheme } from 'react-native';
import { getTheme } from '../../screens/AllChats/AllChats.styles';

export type BotItem = {
  id: string;
  name: string;
  description: string;
  createdByMe?: boolean; // Backend drives this; when true, show Official badge
  avatarUrl?: string | null;
};

export const ChatCard: React.FC<{ item: BotItem; onPress: (bot: BotItem) => void }> = ({ item, onPress }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createAllChatsStyles(t);

  return (
    <Pressable onPress={() => onPress(item)} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, marginBottom: 12 }] }>
      <View style={s.card}>
        <View style={s.avatar} />
        <View style={{ flex: 1 }}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>{item.name}</Text>
            {item.createdByMe && (
              <View style={s.officialBadge}><Text style={s.officialText}>Official</Text></View>
            )}
          </View>
          <Text style={s.cardDesc}>{item.description}</Text>
        </View>
      </View>
    </Pressable>
  );
};
