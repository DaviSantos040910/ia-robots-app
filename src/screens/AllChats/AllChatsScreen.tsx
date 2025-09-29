// src/screens/AllChats/AllChatsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, Pressable, Text, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createAllChatsStyles, getTheme } from './AllChats.styles';
import { ChatRow, type BotItem } from '../../components/allchats/ChatRow';
import { AllChatsSkeletonGroup } from '../../components/allchats/AllChatsSkeletonGroup';
import { AllChatsEmptyState } from '../../components/allchats/AllChatsEmptyState';
import { useNavigation } from '@react-navigation/native';
import { useFadeSlideIn, smoothLayout } from '../../components/shared/Motion';
import BottomNav, { type TabKey } from '../../components/navigation/BottomNav';
import { allChatsService } from '../../services/allChatsService';

// Animated wrapper for list items to create a staggered entrance animation.
const AnimatedChatRow: React.FC<{ item: BotItem; index: number; onPress: (it: BotItem) => void }> = ({ item, index, onPress }) => {
  const anim = useFadeSlideIn({ delay: index * 60, dy: 12, duration: 350 });
  return (
    <Animated.View style={anim}>
      <ChatRow item={item} onPress={onPress} />
    </Animated.View>
  );
};

const AllChatsScreen: React.FC = () => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createAllChatsStyles(t);
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<BotItem[]>([]);
  const [meBadge, setMeBadge] = useState<number>(1);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const chatList = await allChatsService.getChats();
        smoothLayout();
        setBots(chatList);
      } catch (error) {
        console.error("Failed to fetch chats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  const headerAnim = useFadeSlideIn({ dy: -8, duration: 300 });

  const onPlus = () => { navigation.navigate('Create'); };
  const openChat = useCallback((bot: BotItem) => {
    navigation.navigate('ChatScreen', { chatId: bot.id });
  }, [navigation]);
  
  const ItemSeparator = () => <View style={s.divider} />;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={loading ? [] : bots}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedChatRow item={item} index={index} onPress={openChat} />
          )}
          ListHeaderComponent={
            <Animated.View style={[s.header, headerAnim]}>
              <Text style={s.headerTitle}>All chats</Text>
              <Pressable onPress={onPlus} hitSlop={10} style={s.plusBtn}>
                {/* AJUSTE: Tamanho do ícone sutilmente reduzido. */}
                <Ionicons name="add" size={26} color={t.textPrimary} />
              </Pressable>
            </Animated.View>
          }
          ListEmptyComponent={
            !loading ? <AllChatsEmptyState onCreate={onPlus} /> : null
          }
          ListFooterComponent={
            loading ? <AllChatsSkeletonGroup count={8} /> : <View style={{ height: 100 }} />
          }
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={{ paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        />

        <BottomNav
          active={'Chat'}
          meBadgeCount={meBadge}
          onPress={(tab: TabKey) => {
            if (tab === 'Chat') return;
            if (navigation?.navigate) navigation.navigate(tab as any);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default AllChatsScreen;