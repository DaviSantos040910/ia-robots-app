// src/screens/Bots/BotsScreen.tsx
import React, { useCallback, useState } from 'react';
import { FlatList, Text, View, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Bot } from '../../types/chat';
import { BotRow } from '../../components/bots/BotRow';
import { getTheme, createChatListStyles } from '../ChatList/ChatList.styles'; // Reusing styles
import { createBotsScreenStyles } from './Bots.styles';
import { useFadeSlideIn, smoothLayout } from '../../components/shared/Motion';

const AnimatedBotRow: React.FC<{ item: Bot; index: number }> = ({ item, index }) => {
  const anim = useFadeSlideIn({ delay: index * 60, dy: 12, duration: 350 });
  return (
    <Animated.View style={anim}>
      <BotRow item={item} />
    </Animated.View>
  );
};

const BotsScreen: React.FC = () => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createBotsScreenStyles(theme);
  const headerStyles = createChatListStyles(theme); // For the header

  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<Bot[]>([]);

  const fetchBots = useCallback(async () => {
    try {
      // This is the new endpoint to get the user's collection of bots.
      const botList = await api.get<Bot[]>('/api/v1/bots/subscribed/');
      smoothLayout();
      setBots(botList);
    } catch (error) {
      console.error("Failed to fetch subscribed bots:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // useFocusEffect ensures the list is refreshed every time the screen is shown.
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBots();
    }, [fetchBots])
  );

  const headerAnim = useFadeSlideIn({ dy: -8, duration: 300 });

  const ItemSeparator = () => <View style={s.divider} />;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Animated.View style={[headerStyles.header, headerAnim]}>
        <Text style={headerStyles.headerTitle}>{t('botsScreen.title')}</Text>
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.brand.normal} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={bots}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => <AnimatedBotRow item={item} index={index} />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <View style={s.emptyIcon} />
              <Text style={s.emptyTitle}>{t('botsScreen.emptyTitle')}</Text>
              <Text style={s.emptyDesc}>{t('botsScreen.emptyMessage')}</Text>
            </View>
          }
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={s.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default BotsScreen;