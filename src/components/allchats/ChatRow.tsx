
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { createAllChatsStyles, getTheme } from '../../screens/AllChats/AllChats.styles';

export type BotItem = { id: string; name: string; description: string; createdByMe?: boolean; avatarUrl?: string | null; };

export const ChatRow: React.FC<{ item: BotItem; isLast: boolean; onPress: (it: BotItem) => void }>= ({ item, isLast, onPress }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createAllChatsStyles(t);
  return (
    <View>
      <Pressable onPress={() => onPress(item)} style={({ pressed }) => [s.rowPress, { backgroundColor: pressed ? t.surfaceAlt : 'transparent' }]}>
        <View style={s.row}>
          <View style={s.avatar} />
          <View style={s.body}>
            <View style={s.titleRow}>
              <Text style={s.title} numberOfLines={1}>{item.name}</Text>
              {item.createdByMe && (<View style={s.officialBadge}><Text style={s.officialText}>Official</Text></View>)}
            </View>
            <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
          </View>
        </View>
      </Pressable>
      {!isLast && <View style={s.divider} />}
    </View>
  );
};
