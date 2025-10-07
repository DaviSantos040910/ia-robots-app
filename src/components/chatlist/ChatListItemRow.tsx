// src/components/chatlist/ChatListItemRow.tsx
import React from 'react';
import { Pressable, Text, View, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { createChatListStyles, getTheme } from '../../screens/ChatList/ChatList.styles';
import { ChatListItem } from '../../types/chat';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { formatDistanceToNowStrict, type Locale } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

type Props = { 
  item: ChatListItem;
};

// Function to format the timestamp like WhatsApp
const formatTimestamp = (date: string, locale: Locale) => {
    return formatDistanceToNowStrict(new Date(date), { addSuffix: true, locale });
};

export const ChatListItemRow: React.FC<Props> = ({ item }) => {
  const { i18n } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatListStyles(theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    // Navigate to the chat screen, passing all necessary info for the header
    navigation.navigate('ChatScreen', {
      chatId: item.id,
      botName: item.bot.name,
      botHandle: `@${item.bot.name}`, // Placeholder for handle
      botAvatarUrl: item.bot.avatar_url,
    });
  };

  // Determine which locale to use for date-fns
  const dateLocale = i18n.language.startsWith('pt') ? ptBR : enUS;
  
  return (
    <Pressable onPress={handlePress} style={({ pressed }) => ({ backgroundColor: pressed ? theme.surfaceAlt : 'transparent' })}>
      <View style={s.row}>
        <Image 
          source={item.bot.avatar_url ? { uri: item.bot.avatar_url } : require('../../assets/avatar.png')} 
          style={s.avatar} 
        />
        <View style={s.body}>
          <View style={s.titleRow}>
            <Text style={s.title} numberOfLines={1}>{item.bot.name}</Text>
            {item.last_message_at && (
              <Text style={s.timestamp}>
                {formatTimestamp(item.last_message_at, dateLocale)}
              </Text>
            )}
          </View>
          <Text style={s.lastMessage} numberOfLines={1}>
            {item.last_message?.content ?? '...'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};