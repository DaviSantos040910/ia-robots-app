import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  ListRenderItem,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

import { createProfileStyles, getThemeFunction } from "./Profile.styles";
import { useAuth } from "../../contexts/auth/AuthProvider";
import { botService } from "../../services/botService";
import { Bot } from "../../types/chat";
import { MainTabParamList } from "../../types/navigation";

import { ExploreBotRow } from "../../components/explore/ExploreBotRow";
import { Divider } from "../../components/shared/Divider";
import { GradientButton } from "../../components/shared/GradientButton";

// Default Avatar
const DEFAULT_AVATAR = require("../../assets/avatar.png");

type ProfileScreenNavigationProp = BottomTabNavigationProp<
  MainTabParamList,
  "Profile"
> & {
  navigate: (name: string, params?: any) => void;
};

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { isAuthenticated } = useAuth();

  const isDark = scheme === "dark";
  const theme = useMemo(() => getThemeFunction(isDark), [isDark]);
  const styles = useMemo(() => createProfileStyles(theme), [theme]);

  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state for "Recent", "Shared", etc. (Future implementation)
  const [activeTab, setActiveTab] = useState<"recent" | "shared">("recent");

  const fetchMyBots = useCallback(async () => {
    try {
      const myBots = await botService.fetchCreatedBots();
      setBots(myBots);
    } catch (error) {
      console.error("Failed to fetch my bots", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMyBots();
    }, [fetchMyBots])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyBots();
  }, [fetchMyBots]);

  const handleCreatePress = () => {
    navigation.navigate("CreateBot");
  };

  const handleBotPress = (bot: Bot) => {
    navigation.navigate("BotSettings", { botId: bot.id });
  };

  const handleSettingsPress = () => {
    navigation.navigate("Settings");
  };

  const handleEditProfilePress = () => {
    console.log("Edit Profile pressed");
  };

  const renderBotItem: ListRenderItem<Bot> = useCallback(
    ({ item }) => (
      <ExploreBotRow
        id={item.id.toString()}
        name={item.name}
        description={item.description || ""}
        imageUrl={item.avatar_url}
        onPress={() => handleBotPress(item)}
      />
    ),
    [navigation]
  );

  const renderHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        {/* Top Bar with Settings */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
             <Ionicons name="settings-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Info Row */}
        <View style={styles.profileRow}>
          <Image
            source={DEFAULT_AVATAR}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {t("common.user", { defaultValue: "StarrySia" })}
            </Text>
            <Text style={styles.userId}>
              ID 845289347
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfilePress}>
             <Ionicons name="pencil" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tabs / Filter Chips (NotebookLM Style) */}
        <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity 
                    style={[styles.tabChip, activeTab === "recent" && styles.activeTabChip]}
                    onPress={() => setActiveTab("recent")}
                >
                    <Text style={[styles.tabText, activeTab === "recent" && styles.activeTabText]}>
                        {t("profile.recent", { defaultValue: "Recentes" })}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabChip, activeTab === "shared" && styles.activeTabChip]}
                    onPress={() => setActiveTab("shared")}
                >
                    <Text style={[styles.tabText, activeTab === "shared" && styles.activeTabText]}>
                         {t("profile.shared", { defaultValue: "Compartilhados" })}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>

         {/* Section Header (Title column) */}
         <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderTitle}>{t("profile.title", { defaultValue: "Título" })}</Text>
         </View>
      </View>
    ),
    [styles, isAuthenticated, t, theme, activeTab]
  );

  const renderEmptyState = useMemo(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {t("profile.noBots", {
            defaultValue: "Você ainda não tem cadernos.",
          })}
        </Text>
        <GradientButton
          title={t("profile.createNotebook", {
            defaultValue: "Criar novo Caderno",
          })}
          onPress={handleCreatePress}
          style={styles.createButton}
        />
      </View>
    );
  }, [styles, t, loading]);

  if (loading && bots.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader}
        <ActivityIndicator
          size="large"
          color={theme.brand.normal}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={bots}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBotItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.brand.normal}
          />
        }
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
