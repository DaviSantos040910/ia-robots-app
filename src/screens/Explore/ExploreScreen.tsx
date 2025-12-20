import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { exploreService } from "../../services/exploreService";
import { botService } from "../../services/botService";
import { ExploreBotRow } from "../../components/explore/ExploreBotRow";
import SearchHistory from "../../components/explore/SearchHistory";
import { CategorySelector } from "../../components/create/CategorySelector";
import { LabeledTextInput } from "../../components/shared/LabeledTextInput";
import { SkeletonBlock } from "../../components/shared/Skeleton";
import { useTranslation } from "react-i18next"; // Importando i18n
import { FEATURES } from "../../config/featureFlags"; // Importando Flags
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
  }, [selectedCategory]); // Recarrega ao mudar categoria

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name
    : null;

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
      <View style={s.header}>
        <Text style={[s.title, { color: theme.brand.text }]}>
          {t("mainTabs.explore")}
        </Text>
      </View>

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

        {/* Sugestões/Categorias (Filtro Rápido) */}
        {FEATURES.SHOW_EXPLORE_SUGGESTIONS && (
          <View style={s.section}>
            <CategorySelector
              allCategories={categories}
              selectedIds={selectedCategory ? [selectedCategory] : []}
              onToggleCategory={(id) =>
                setSelectedCategory((prev) => (prev === id ? null : id))
              }
            />
          </View>
        )}

        {/* Lista de Resultados */}
        <View style={s.listContainer}>
          <Text style={[s.sectionTitle, { color: theme.brand.text }]}>
            {selectedCategoryName ||
              t("explore.allDocuments") ||
              "Todos os Documentos"}
          </Text>

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
                color: theme.brand.textSecondary,
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  title: {
    ...typography.h4,
    fontWeight: "700",
  },
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
  listContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    marginBottom: spacing.md,
    fontWeight: "600",
  },
});
