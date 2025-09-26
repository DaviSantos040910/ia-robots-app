import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, Pressable, Text, View, Animated, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { createAllChatsStyles, getTheme } from './AllChats.styles';
import { ChatRow, type BotItem } from '../../components/allchats/ChatRow';
import { AllChatsSkeletonGroup } from '../../components/allchats/AllChatsSkeletonGroup';
import { AllChatsEmptyState } from '../../components/allchats/AllChatsEmptyState';
import { useNavigation } from '@react-navigation/native';
import { useFadeSlideIn, smoothLayout } from '../../components/shared/Motion';
import BottomNav, { type TabKey } from '../../components/navigation/BottomNav';

const BOTTOM_NAV_HEIGHT = 84; // ajuste se seu BottomNav tiver outra altura

const AllChatsScreen: React.FC = () => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createAllChatsStyles(t);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<BotItem[]>([]);
  const [meBadge, setMeBadge] = useState<number>(1);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const initial: BotItem[] = [
        { id: 'starry', name: 'StarryAI bot', description: 'Psychologist that always here for you.', createdByMe: true },
        { id: 'space', name: 'Space traveler', description: "Hello. I'm your new friend, Space" },
      ];
      smoothLayout();
      setBots(initial);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const headerAnim = useFadeSlideIn({ dy: -8, duration: 300 });

  const onPlus = () => { navigation.navigate('Create'); };
  const openChat = useCallback((bot: BotItem) => {
    navigation.navigate('ChatScreen', { chatId: bot.id, bootstrap: { bot: { name: bot.name, handle: bot.id, avatarUrl: null } } });
  }, [navigation]);

  const contentBottomSpacer = BOTTOM_NAV_HEIGHT + insets.bottom;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Animated.View style={[s.header, headerAnim]}>
        <View style={s.headerCenter}><Text style={s.headerTitle}>All chats</Text></View>
        <View style={s.headerSide}>
          <Pressable onPress={onPlus} hitSlop={10} style={s.plusBtn}>
            <Text style={s.plusText}>+</Text>
          </Pressable>
        </View>
      </Animated.View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1 }}>
            <AllChatsSkeletonGroup count={6} />
            <View style={{ height: contentBottomSpacer }} />
          </View>
        ) : bots.length === 0 ? (
          <View style={{ flex: 1 }}>
            <AllChatsEmptyState onCreate={onPlus} />
            <View style={{ height: contentBottomSpacer }} />
          </View>
        ) : (
          <View style={[s.groupWrap, { paddingBottom: contentBottomSpacer + 12 }]}>
            <View style={s.group}>
              <FlatList
                data={bots}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <ChatRow item={item} isLast={index === bots.length - 1} onPress={openChat} />
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        )}

        <View style={[styles.bottomNavWrap, { height: BOTTOM_NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
          <BottomNav
            active={'Chat'}
            meBadgeCount={meBadge}
            onPress={(tab: TabKey) => {
              if (tab === 'Chat') return;
              if (navigation?.navigate) navigation.navigate(tab as any);
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomNavWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});

export default AllChatsScreen;
