// src/components/bots/BotRow.tsx
import React from 'react';
import { Pressable, Text, View, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { botService } from '../../services/botService'; // Import the service
import { Bot } from '../../types/chat';
import { RootStackParamList } from '../../types/navigation';
import { getTheme } from '../../screens/ChatList/ChatList.styles';
import { createBotsScreenStyles } from '../../screens/Bots/Bots.styles';

type Props = {
  item: Bot;
};

export const BotRow: React.FC<Props> = ({ item }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createBotsScreenStyles(theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // --- REFACTORED: Now uses the service layer ---
  const handlePress = async () => {
    try {
      // Call the bootstrap function from the bot service.
      const bootstrapData = await botService.getChatBootstrap(item.id);
      
      navigation.navigate('ChatScreen', {
        chatId: bootstrapData.conversationId,
        botId: item.id, // --- ADICIONADO: Passa o botId para o ecrã de chat ---
        botName: bootstrapData.bot.name,
        botHandle: bootstrapData.bot.handle,
        botAvatarUrl: bootstrapData.bot.avatarUrl,
      });
    } catch (error) {
      console.error("Failed to bootstrap chat from Bots screen:", error);
    }
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => ({ backgroundColor: pressed ? theme.surfaceAlt : 'transparent' })}>
      <View style={s.row}>
        <Image 
          source={item.avatar_url ? { uri: item.avatar_url } : require('../../assets/avatar.png')} 
          style={s.avatar} 
        />
        <View style={s.body}>
          <Text style={s.title} numberOfLines={1}>{item.name}</Text>
          <Text style={s.description} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>
    </Pressable>
  );
};