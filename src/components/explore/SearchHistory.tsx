// src/components/explore/SearchHistory.tsx
import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { createExploreStyles, getTheme } from '../../screens/Explore/Explore.styles';
import { SearchHistoryItem } from '../../services/searchHistoryService';
import { ScalePressable } from '../shared/Motion';

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onPressItem: (term: string) => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onRemoveItem, onClearAll, onPressItem }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createExploreStyles(t);

  const renderItem = ({ item }: { item: SearchHistoryItem }) => (
    <View style={s.historyRow}>
      <Pressable style={s.historyRowContent} onPress={() => onPressItem(item.term)}>
        <Feather name="clock" size={20} color={t.textSecondary} />
        <Text style={s.historyText}>{item.term}</Text>
      </Pressable>

      <ScalePressable onPress={() => onRemoveItem(item.id)} hitSlop={10}>
        <Feather name="x" size={20} color={t.textSecondary} />
      </ScalePressable>
    </View>
  );

  if (history.length === 0) {
    return null; // Don't render anything if there's no history
  }

  return (
    <View style={s.historyContainer}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
      <ScalePressable onPress={onClearAll} style={s.clearHistoryButton}>
        <Text style={s.clearHistoryText}>Clear all search history</Text>
      </ScalePressable>
    </View>
  );
};

export default SearchHistory;