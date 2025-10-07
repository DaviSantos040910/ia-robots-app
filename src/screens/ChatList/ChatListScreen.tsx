// src/screens/ChatList/ChatListScreen.tsx
import React, { useCallback, useState } from 'react';
import { FlatList, Text, View, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { createChatListStyles, getTheme } from './ChatList.styles';
import { ChatListItemRow } from '../../components/chatlist/ChatListItemRow';
import { useFadeSlideIn, smoothLayout } from '../../components/shared/Motion';
import { ChatListItem } from '../../types/chat';
import { chatListService } from '../../services/chatListService'; // --- CORREÇÃO: Importar o serviço

const AnimatedChatRow: React.FC<{ item: ChatListItem; index: number }> = ({ item, index }) => {
  const anim = useFadeSlideIn({ delay: index * 60, dy: 12, duration: 350 });
  return (
    <Animated.View style={anim}>
      <ChatListItemRow item={item} />
    </Animated.View>
  );
};

const ChatListScreen: React.FC = () => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatListStyles(theme);

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatListItem[]>([]);

  // --- REFACTORED: Now uses the service layer ---
  const fetchChats = useCallback(async () => {
    // The component no longer knows how the data is fetched, it just asks the service.
    const chatList = await chatListService.getActiveChats();
    smoothLayout();
    setChats(chatList);
    setLoading(false); // setLoading can be moved here as the service handles errors
  }, []);

  // useFocusEffect ensures the list is refreshed every time the screen comes into view
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchChats();
    }, [fetchChats])
  );

  const headerAnim = useFadeSlideIn({ dy: -8, duration: 300 });

  const ItemSeparator = () => <View style={s.divider} />;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Animated.View style={[s.header, headerAnim]}>
        <Text style={s.headerTitle}>{t('mainTabs.chat')}</Text>
      </Animated.View>
      
      {loading ? (
        <ActivityIndicator size="large" color={theme.brand.normal} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedChatRow item={item} index={index} />
          )}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <View style={s.emptyIcon} />
              <Text style={s.emptyTitle}>{t('botsScreen.emptyTitle')}</Text>
              <Text style={s.emptyDesc}>{t('botsScreen.emptyMessage')}</Text>
            </View>
          }
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default ChatListScreen;