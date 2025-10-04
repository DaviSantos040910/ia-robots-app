// src/screens/Explore/ExploreScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TextInput, ScrollView, Pressable, ActivityIndicator, Animated, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { createExploreStyles, getTheme } from './Explore.styles';
import { exploreService, Category, ExploreBotItem } from '../../services/exploreService';
import { ExploreBotRow } from '../../components/explore/ExploreBotRow';
import { useFadeSlideIn, ScalePressable } from '../../components/shared/Motion';
import searchHistoryService, { SearchHistoryItem } from '../../services/searchHistoryService';
import SearchHistory from '../../components/explore/SearchHistory';

// --- Sub-components ---

const SearchBar: React.FC<{
  onFocus: () => void;
  onCancel: () => void;
  isSearchActive: boolean;
}> = ({ onFocus, onCancel, isSearchActive }) => {
  const { t } = useTranslation();
  const theme = getTheme(useColorScheme() === 'dark');
  const s = createExploreStyles(theme);
  const cancelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cancelAnim, {
      toValue: isSearchActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSearchActive]);

  const cancelWidth = cancelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  return (
    <View style={s.searchSection}>
      <View style={s.searchBarContainer}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          placeholder={t('explore.searchPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          style={s.searchInput}
          onFocus={onFocus}
        />
      </View>
      <Animated.View style={{ width: cancelWidth, overflow: 'hidden' }}>
        <Pressable onPress={onCancel} style={s.cancelButton}>
          <Text style={s.cancelButtonText}>{t('common.cancel')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

// AJUSTE: Componente restaurado para dentro do arquivo.
const CategoryFilter: React.FC<{
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
}> = ({ categories, activeCategoryId, onSelectCategory }) => {
  const theme = getTheme(useColorScheme() === 'dark');
  const s = createExploreStyles(theme);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryScrollView}>
      {categories.map(category => (
        <ScalePressable key={category.id} onPress={() => onSelectCategory(category.id)}>
          <View style={[s.categoryChip, activeCategoryId === category.id && s.categoryChipActive]}>
            <Text style={[s.categoryText, activeCategoryId === category.id && s.categoryTextActive]}>
              {category.name}
            </Text>
          </View>
        </ScalePressable>
      ))}
    </ScrollView>
  );
};

// AJUSTE: Componente restaurado para dentro do arquivo.
const AnimatedBotRow: React.FC<{
  item: ExploreBotItem;
  index: number;
  onPress: (item: ExploreBotItem) => void;
  onToggleFollow: (item: ExploreBotItem) => void;
}> = ({ item, index, onPress, onToggleFollow }) => {
  const anim = useFadeSlideIn({ delay: index * 60, dy: 12, duration: 350 });
  return (
    <Animated.View style={anim}>
      <ExploreBotRow item={item} onPress={onPress} onToggleFollow={onToggleFollow} />
    </Animated.View>
  );
};

// --- Main Screen Component ---
const ExploreScreen: React.FC = () => {
  const scheme = useColorScheme();
  // AJUSTE: Renomeado para 'theme' para evitar conflito com a função de tradução 't'.
  const theme = getTheme(scheme === 'dark');
  const s = createExploreStyles(theme);
  const navigation = useNavigation<any>();
  const { t } = useTranslation(); // 't' é a função de tradução.

  // --- State Management ---
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBots, setLoadingBots] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bots, setBots] = useState<ExploreBotItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('featured');

  const mainContentOpacity = useRef(new Animated.Value(1)).current;

  // --- Animation for transitioning ---
  useEffect(() => {
    Animated.timing(mainContentOpacity, {
      toValue: isSearchActive ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSearchActive]);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingCategories(true);
      try {
        const [categoriesData, historyData] = await Promise.all([
          exploreService.getCategories(),
          searchHistoryService.getHistory(),
        ]);
        setCategories(categoriesData);
        setSearchHistory(historyData);
        if (categoriesData.length > 0 && !categoriesData.some(c => c.id === activeCategoryId)) {
          setActiveCategoryId(categoriesData[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchBots = async () => {
      if (!activeCategoryId) return;
      setLoadingBots(true);
      setBots([]);
      try {
        const data = await exploreService.getBots(activeCategoryId);
        setBots(data);
      } catch (error) {
        console.error(`Failed to fetch bots for category ${activeCategoryId}:`, error);
      } finally {
        setLoadingBots(false);
      }
    };
    fetchBots();
  }, [activeCategoryId]);

  // --- Handlers ---
  const handleSearchFocus = () => setIsSearchActive(true);
  const handleSearchCancel = () => {
    Keyboard.dismiss();
    setIsSearchActive(false);
  };
  
  const handleRemoveHistoryItem = async (id: string) => {
    const updatedHistory = await searchHistoryService.removeSearchTerm(id);
    setSearchHistory(updatedHistory);
  };

  const handleClearHistory = async () => {
    await searchHistoryService.clearHistory();
    setSearchHistory([]);
  };

  const handleToggleFollow = useCallback((botToToggle: ExploreBotItem) => {
    setBots(currentBots =>
      currentBots.map(bot =>
        bot.id === botToToggle.id ? { ...bot, followed: !bot.followed } : bot
      )
    );
  }, []);

  const openChat = useCallback((bot: ExploreBotItem) => {
    navigation.navigate('ChatScreen', { chatId: bot.id });
  }, [navigation]);
  
  const ItemSeparator = () => <View style={s.divider} />;

  // --- Render ---
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
        {/* Header with Search Bar */}
        <View style={s.header}>
          <SearchBar 
            onFocus={handleSearchFocus}
            onCancel={handleSearchCancel}
            isSearchActive={isSearchActive}
          />
        </View>

        {/* Conditional Rendering: Search History or Main Content */}
        {isSearchActive ? (
          <SearchHistory 
            history={searchHistory}
            onRemoveItem={handleRemoveHistoryItem}
            onClearAll={handleClearHistory}
            onPressItem={(term) => console.log('Search for:', term)}
          />
        ) : (
          <>
            {loadingCategories ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.brand.normal} />
              </View>
            ) : (
              <FlatList
                data={bots}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                  <AnimatedBotRow 
                    item={item} 
                    index={index} 
                    onPress={openChat}
                    onToggleFollow={handleToggleFollow}
                  />
                )}
                ListHeaderComponent={
                  <CategoryFilter
                    categories={categories}
                    activeCategoryId={activeCategoryId}
                    onSelectCategory={setActiveCategoryId}
                  />
                }
                contentContainerStyle={s.listContentContainer}
                ItemSeparatorComponent={ItemSeparator}
              />
            )}
          </>
        )}
    </SafeAreaView>
  );
};

export default ExploreScreen;