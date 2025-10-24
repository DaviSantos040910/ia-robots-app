// src/screens/ArchivedChats/ArchivedChatsScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { ChatListItem } from '../../types/chat';
import api from '../../services/api';
import { getTheme } from '../ChatList/ChatList.styles';
import { createArchivedChatsStyles } from './ArchivedChats.styles';
import { format } from 'date-fns';
import { ptBR, enUS, type Locale } from 'date-fns/locale'; // Import Locale type

// Define the props for this screen, which includes the route params
type Props = NativeStackScreenProps<RootStackParamList, 'ArchivedChats'>;

// A simple component for rendering a single row in the list
const ArchivedChatRow: React.FC<{ item: ChatListItem }> = ({ item }) => {
  const { t, i18n } = useTranslation(); // Correctly declare 't' here
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createArchivedChatsStyles(theme);
  const navigation = useNavigation<Props['navigation']>();

  // When a user taps an archived chat, navigate to the ChatScreen to view it
  const handlePress = () => {
    navigation.navigate('ChatScreen', {
      chatId: item.id,
      botId: item.bot.id, // --- ADICIONADO: Passa o botId para o ecrã de chat ---
      botName: item.bot.name,
      botHandle: `@${item.bot.name}`, // Placeholder
      botAvatarUrl: item.bot.avatar_url,
      isArchived: true,
    });
  };
  
  // Format the date for display
  const dateLocale = i18n.language.startsWith('pt') ? ptBR : enUS;
  const formattedDate = format(new Date(item.last_message_at), 'PPp', { locale: dateLocale });

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [s.row, { opacity: pressed ? 0.7 : 1 }]}>
      <Text style={s.rowText}>{`${t('archivedChats.chatFrom')} ${formattedDate}`}</Text>
      <Feather name="chevron-right" size={20} style={s.rowIcon} />
    </Pressable>
  );
};

const ArchivedChatsScreen: React.FC<Props> = ({ route }) => {
  const { botId } = route.params; // Get the botId passed from the ChatScreen
  const { t } = useTranslation(); // Correctly declare 't' here
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createArchivedChatsStyles(theme);
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(true);
  const [archivedChats, setArchivedChats] = useState<ChatListItem[]>([]);

  // --- CORREÇÃO APLICADA AQUI ---
  // The async function must be wrapped inside the effect callback.
  useFocusEffect(
    useCallback(() => {
      const fetchArchivedChats = async () => {
        setIsLoading(true);
        try {
          const response = await api.get<ChatListItem[]>(`/api/v1/chats/archived/bot/${botId}/`);
          setArchivedChats(response);
        } catch (error) {
          console.error("Failed to fetch archived chats:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchArchivedChats();
    }, [botId]) // Dependency array ensures it refetches if the botId ever changes
  );

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {/* Custom Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backButton} hitSlop={20}>
          <Feather name="chevron-left" size={26} color={theme.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>{t('archivedChats.title')}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.brand.normal} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={archivedChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ArchivedChatRow item={item} />}
          contentContainerStyle={s.listContentContainer}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyText}>{t('archivedChats.empty')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ArchivedChatsScreen;