import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { styles } from './AllChats.styles';
import ChatCard from '../../components/allchats/ChatCard';
import BottomNav, { type TabKey } from '../../components/navigation/BottomNav';
import { useNavigation } from '@react-navigation/native';

interface BotItem {
  id: string;
  name: string;
  description: string;
  official: boolean;
  createdByMe: boolean;
}

const AllChatsScreen: React.FC = () => {
  const scheme = useColorScheme();
  const s = styles; // usando o styles diretamente
  const navigation = useNavigation<any>();

  const [bots, setBots] = useState<BotItem[]>([]);
  const [meBadge, setMeBadge] = useState<number>(1);

  useEffect(() => {
    const initial: BotItem[] = [
      { id: '1', name: 'Anime Bot', description: 'Your official anime assistant', official: true, createdByMe: false },
      { id: '2', name: 'Manga Chat', description: 'Discuss your favorite manga here', official: false, createdByMe: false },
      { id: '3', name: 'Otaku Friends', description: 'Meet fellow anime fans', official: false, createdByMe: false },
    ];
    setBots(initial);
  }, []);

  const onAdd = () => navigation?.navigate('Create');
  const openChat = useCallback((bot: BotItem) => {
    navigation?.navigate('ChatScreen', { chatId: bot.id, bootstrap: { bot: { name: bot.name, handle: bot.id, avatarUrl: null } } });
  }, [navigation]);

  const renderItem = ({ item }: { item: BotItem }) => <ChatCard chat={item} onPress={() => openChat(item)} />;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View style={s.headerSide} />
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>All chats</Text>
        </View>
        <View style={s.headerSide}>
          <Pressable onPress={onAdd} hitSlop={10} style={s.addButton}>
            <Text style={{ fontSize: 24, color: '#007AFF' }}>＋</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={bots}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />

      <BottomNav
        active={'Chat'}
        meBadgeCount={meBadge}
        onPress={(tab: TabKey) => {
          if (tab === 'Chat') return;
          if (tab === 'Add') {
            navigation?.navigate('Create'); // <-- aqui manda pra CreateBot
          } else {
            navigation?.navigate(tab);
          }
        }}
      />
    </SafeAreaView>
  );
};

export default AllChatsScreen;
