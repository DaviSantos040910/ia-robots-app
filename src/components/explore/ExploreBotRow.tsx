// src/components/explore/ExploreBotRow.tsx
import React, { useState } from 'react';
import { Pressable, Text, View, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createExploreStyles, getTheme } from '../../screens/Explore/Explore.styles';
import { Bot } from '../../types/chat';
import { ScalePressable } from '../shared/Motion';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { botService } from '../../services/botService'; // Import botService
import { exploreService } from '../../services/exploreService'; // Import exploreService

export type ExploreBotItem = Bot & { is_subscribed?: boolean };

interface Props {
  item: ExploreBotItem;
}

export const ExploreBotRow: React.FC<Props> = ({ item }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createExploreStyles(theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isSubscribed, setIsSubscribed] = useState(item.is_subscribed ?? false);
  const [isLoading, setIsLoading] = useState(false);

  // --- REFACTORED: Now uses the service layer ---
  const handleToggleSubscribe = async () => {
    setIsLoading(true);
    try {
      // Call the dedicated function from the service file.
      await exploreService.toggleBotSubscription(item.id);
      setIsSubscribed(prev => !prev);
    } catch (error) {
      console.error("Failed to toggle subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- REFACTORED: Now uses the service layer ---
  const handleRowPress = async () => {
    try {
      // Call the bootstrap function from the bot service.
      const bootstrapData = await botService.getChatBootstrap(item.id);
      
      navigation.navigate('ChatScreen', {
        chatId: bootstrapData.conversationId,
        botName: bootstrapData.bot.name,
        botHandle: bootstrapData.bot.handle,
        botAvatarUrl: bootstrapData.bot.avatarUrl,
      });
    } catch (error) {
      console.error("Failed to bootstrap chat from explore:", error);
    }
  };

  return (
    <Pressable onPress={handleRowPress} style={({ pressed }) => [s.row, { backgroundColor: pressed ? theme.surfaceAlt : 'transparent' }]}>
      <Image 
        source={item.avatar_url ? { uri: item.avatar_url } : require('../../assets/avatar.png')} 
        style={s.avatar} 
      />
      
      <View style={s.body}>
        <Text style={s.title} numberOfLines={1}>{item.name}</Text>
        <Text style={s.desc} numberOfLines={1}>{item.description}</Text>
      </View>

      <ScalePressable onPress={handleToggleSubscribe} disabled={isLoading} style={s.followButton}>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.brand.normal} />
        ) : (
          <Ionicons 
            name={isSubscribed ? "checkmark-circle" : "add-circle-outline"}
            size={32}
            color={isSubscribed ? theme.brand.normal : theme.textSecondary}
          />
        )}
      </ScalePressable>
    </Pressable>
  );
};