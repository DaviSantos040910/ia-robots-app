// src/components/explore/ExploreBotRow.tsx
import React from 'react';
import { Pressable, Text, View, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createExploreStyles, getTheme } from '../../screens/Explore/Explore.styles';
import { ExploreBotItem } from '../../services/exploreService';
import { ScalePressable } from '../shared/Motion';

interface Props {
  item: ExploreBotItem;
  onPress: (item: ExploreBotItem) => void;
  onToggleFollow: (item: ExploreBotItem) => void;
}

export const ExploreBotRow: React.FC<Props> = ({ item, onPress, onToggleFollow }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createExploreStyles(t);

  return (
    <Pressable onPress={() => onPress(item)} style={({ pressed }) => [s.row, { backgroundColor: pressed ? t.surfaceAlt : 'transparent' }]}>
      {/* Avatar */}
      <Image source={require('../../assets/avatar.png')} style={s.avatar} />
      
      {/* Body: Title and Description */}
      <View style={s.body}>
        <Text style={s.title} numberOfLines={1}>{item.name}</Text>
        <Text style={s.desc} numberOfLines={1}>{item.description}</Text>
      </View>

      {/* Action Button: Follow/Unfollow */}
      <ScalePressable onPress={() => onToggleFollow(item)}>
        <View style={s.followButton}>
          <Ionicons 
            name={item.followed ? "checkmark-circle" : "add-circle"}
            size={32}
            color={t.brand.normal}
          />
        </View>
      </ScalePressable>
    </Pressable>
  );
};