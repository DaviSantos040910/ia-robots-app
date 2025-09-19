
  import React, { useEffect, useState, useCallback } from 'react';
  import { FlatList, Pressable, Text, View } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { useColorScheme } from 'react-native';
  import { createAllChatsStyles, getTheme } from './AllChats.styles';
  import { ChatCard, type BotItem } from '../../components/allchats/ChatCard';
  import { BottomNav, type TabKey } from '../../components/navigation/BottomNav';
  import { useNavigation } from '@react-navigation/native';

  const AllChatsScreen: React.FC = () => {
    const scheme = useColorScheme();
    const t = getTheme(scheme === 'dark');
    const s = createAllChatsStyles(t);
    const navigation = useNavigation<any>();

    const [bots, setBots] = useState<BotItem[]>([]);
    const [meBadge, setMeBadge] = useState<number>(1);

    // Mock: hydrate from backend later
    useEffect(() => {
      const initial: BotItem[] = [
        { id: 'starry', name: 'StarryAI bot', description: 'Psychologist that always here for you.', createdByMe: true },
        { id: 'atlas', name: 'Atlas AI', description: 'Assistant for productivity and notes.', createdByMe: false },
        { id: 'lumi', name: 'Lumi Tutor', description: 'Math tutor that explains step by step.', createdByMe: false },
      ];
      setBots(initial);
    }, []);

    const onAdd = () => {
      // TODO: navigate to create flow
      if (navigation?.navigate) navigation.navigate('Create');
    };

    const openChat = useCallback((bot: BotItem) => {
      // TODO: navigate to ChatScreen with params
      if (navigation?.navigate) navigation.navigate('ChatScreen', { chatId: bot.id, bootstrap: { bot: { name: bot.name, handle: bot.id, avatarUrl: null } } });
    }, [navigation]);

    const renderItem = ({ item }: { item: BotItem }) => (
      <ChatCard item={item} onPress={openChat} />
    );

    return (
      <SafeAreaView style={s.screen} edges={['top','bottom']}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerSide} />
          <View style={s.headerCenter}><Text style={s.headerTitle}>All chats</Text></View>
          <View style={s.headerSide}>
            <Pressable onPress={onAdd} hitSlop={10} style={s.headerIconBtn}>
              <Text style={s.headerIconText}>{'+'}</Text>
            </Pressable>
          </View>
        </View>

        {/* List */}
        <FlatList
          data={bots}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Bottom navigation */}
        <BottomNav
          active={'Chat'}
          meBadgeCount={meBadge}
          onPress={(tab: TabKey) => {
            // Wire basic navigation names – replace with real routes later
            if (tab === 'Chat') return; // already here
            if (navigation?.navigate) navigation.navigate(tab);
          }}
        />
      </SafeAreaView>
    );
  };

  export default AllChatsScreen;
