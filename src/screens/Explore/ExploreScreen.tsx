// src/screens/Explore/ExploreScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TextInput, ScrollView, Pressable, ActivityIndicator, Animated, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { createExploreStyles, getTheme } from './Explore.styles';
import { exploreService, Category } from '../../services/exploreService'; // Updated service
import { ExploreBotRow, ExploreBotItem } from '../../components/explore/ExploreBotRow';
import { useFadeSlideIn, ScalePressable, smoothLayout } from '../../components/shared/Motion';
import searchHistoryService, { SearchHistoryItem } from '../../services/searchHistoryService';
import SearchHistory from '../../components/explore/SearchHistory';

// --- Sub-components (SearchBar, CategoryFilter) can remain the same ---

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

const AnimatedBotRow: React.FC<{ item: ExploreBotItem; index: number; }> = ({ item, index }) => {
  const anim = useFadeSlideIn({ delay: index * 60, dy: 12, duration: 350 });
  return (
    <Animated.View style={anim}>
      {/* The component now handles its own press and subscription logic */}
      <ExploreBotRow item={item} />
    </Animated.View>
  );
};

// --- Main Screen Component ---
const ExploreScreen: React.FC = () => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createExploreStyles(theme);
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  // --- State Management ---
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBots, setLoadingBots] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bots, setBots] = useState<ExploreBotItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('featured'); // Default category

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
        // Set the first category as active if 'featured' doesn't exist
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
      setBots([]); // Clear previous bots
      try {
        const data = await exploreService.getBots(activeCategoryId);
        smoothLayout();
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
  
  const ItemSeparator = () => <View style={s.divider} />;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.header}>
          <SearchBar 
            onFocus={handleSearchFocus}
            onCancel={handleSearchCancel}
            isSearchActive={isSearchActive}
          />
        </View>

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
              <ActivityIndicator style={{ marginTop: 20 }} size="large" color={theme.brand.normal} />
            ) : (
              <FlatList
                data={bots}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item, index }) => <AnimatedBotRow item={item} index={index} />}
                ListHeaderComponent={
                  <CategoryFilter
                    categories={categories}
                    activeCategoryId={activeCategoryId}
                    onSelectCategory={setActiveCategoryId}
                  />
                }
                ListFooterComponent={
                  loadingBots ? <ActivityIndicator style={{ marginVertical: 20 }} color={theme.brand.normal} /> : null
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