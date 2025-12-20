import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/colors";
import { NeutralColors } from "../../theme/neutralColors";
import { spacing } from "../../theme/spacing";
import { Typography } from "../../theme/typography";
import { exploreService } from "../../services/exploreService";
import { botService } from "../../services/botService";
import { ExploreBotRow } from "../../components/explore/ExploreBotRow";
import SearchHistory from "../../components/explore/SearchHistory";
import { LabeledTextInput } from "../../components/shared/LabeledTextInput";
import { SkeletonBlock } from "../../components/shared/Skeleton";
import { useTranslation } from "react-i18next";
import { FEATURES } from "../../config/featureFlags";
import type { Category, ExploreBotItem } from "../../services/exploreService";
import type { SearchHistoryItem } from "../../services/searchHistoryService";
import type { RootStackParamList } from "../../types/navigation";

export const ExploreScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bots, setBots] = useState<ExploreBotItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await exploreService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  const fetchBots = async () => {
    setIsLoading(true);
    try {
      const q = searchQuery.trim();
      const data = q
        ? await exploreService.searchBots(q)
        : await exploreService.getBots(selectedCategory ?? undefined);

      setBots(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, [selectedCategory]);

  const handleBotPress = async (botId: string) => {
    try {
      const bootstrapData = await botService.getChatBootstrap(botId);
      navigation.navigate("ChatScreen", {
        chatId: bootstrapData.conversationId,
        botId,
        botName: bootstrapData.bot.name,
        botHandle: bootstrapData.bot.handle,
        botAvatarUrl: bootstrapData.bot.avatarUrl,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View
      style={[
        s.container,
        { backgroundColor: theme.brand.background, paddingTop: insets.top },
      ]}
    >
      {/* HEADER REMOVIDO CONFORME SOLICITADO */}

      <ScrollView
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchBots}
            tintColor={theme.brand.normal}
          />
        }
      >
        {/* Barra de Busca (Controlada por Flag) */}
        {FEATURES.SHOW_EXPLORE_SEARCH_BAR && (
          <View style={s.searchContainer}>
            <LabeledTextInput
              label={t("explore.searchPlaceholder") || "Buscar..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("explore.searchPlaceholder") || "Buscar..."}
              returnKeyType="search"
              onSubmitEditing={fetchBots}
            />
          </View>
        )}

        {/* Histórico de Busca (Controlado por Flag) */}
        {FEATURES.SHOW_EXPLORE_HISTORY && (
          <View style={s.section}>
            <SearchHistory
              history={history}
              onRemoveItem={(id) =>
                setHistory((prev) => prev.filter((h) => h.id !== id))
              }
              onClearAll={() => setHistory([])}
              onPressItem={(term) => {
                setSearchQuery(term);
                fetchBots();
              }}
            />
          </View>
        )}

        {/* Categorias (Lista Horizontal) */}
        {FEATURES.SHOW_EXPLORE_SUGGESTIONS && (
          <View style={s.categoriesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.categoriesContent}
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() =>
                      setSelectedCategory((prev) =>
                        prev === category.id ? null : category.id
                      )
                    }
                    style={[
                      s.categoryChip,
                      {
                        backgroundColor: isSelected
                          ? theme.brand.normal
                          : theme.brand.surface, // Fallback caso surfaceAlt não exista no tema direto
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.categoryText,
                        {
                          color: isSelected
                            ? NeutralColors.neutral.light.white1
                            : theme.brand.primary,
                        },
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Lista de Resultados */}
        <View style={s.listContainer}>
          {/* TÍTULO "ALL MODULOS" REMOVIDO CONFORME SOLICITADO */}

          {isLoading ? (
            <>
              <SkeletonBlock
                width="100%"
                height={80}
                style={{ marginBottom: 10 }}
              />
              <SkeletonBlock
                width="100%"
                height={80}
                style={{ marginBottom: 10 }}
              />
              <SkeletonBlock
                width="100%"
                height={80}
                style={{ marginBottom: 10 }}
              />
            </>
          ) : (
            bots.map((bot) => (
              <ExploreBotRow
                key={bot.id}
                id={bot.id}
                name={bot.name}
                description={bot.description}
                imageUrl={
                  (bot as any).imageUrl ?? (bot as any).avatar_url ?? null
                }
                onPress={() => handleBotPress(bot.id)}
              />
            ))
          )}

          {!isLoading && bots.length === 0 && (
            <Text
              style={{
                color: theme.brand.text,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              {t("common.noResults") || "Nenhum documento encontrado."}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Estilos de Header removidos pois o componente foi removido
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  // Novos estilos para as categorias (Aba horizontal)
  categoriesSection: {
    marginTop: spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 100, // Radius.round
    marginRight: 8,
  },
  categoryText: {
    ...Typography.bodySemiBold.medium,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
});
