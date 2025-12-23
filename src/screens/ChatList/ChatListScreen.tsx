import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/colors";
import { Typography } from "../../theme/typography";
import { Spacing } from "../../theme/spacing";
import { Radius } from "../../theme/radius";
import { RootStackParamList } from "../../types/navigation";
import { ChatListItem } from "../../types/chat";
import { chatListService } from "../../services/chatListService";
import Ionicons from "@expo/vector-icons/Ionicons";

// Componente local para o item da lista (pode ser extraído)
const ChatListItemRow = ({
  item,
  onPress,
  theme,
}: {
  item: ChatListItem;
  onPress: () => void;
  theme: any;
}) => {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          alignItems: "center",
          padding: Spacing["spacing-group-s"],
          backgroundColor: theme.surface,
          borderRadius: Radius.card,
          marginBottom: Spacing["spacing-element-s"],
          shadowColor: theme.brand.light, // Subtle shadow
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 1,
        },
        avatarContainer: {
          marginRight: Spacing["spacing-element-m"],
        },
        avatar: {
          width: 48,
          height: 48,
          borderRadius: 12, // NotebookLM uses rounded squares often
          backgroundColor: theme.surfaceAlt,
        },
        content: {
          flex: 1,
          justifyContent: "center",
        },
        headerRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 4,
        },
        name: {
          ...Typography.presets.bodyRegular.medium,
          fontWeight: "600",
          color: theme.textPrimary,
        },
        time: {
          ...Typography.presets.caption,
          color: theme.textSecondary,
        },
        message: {
          ...Typography.presets.bodyRegular.small,
          color: theme.textSecondary,
        },
      }),
    [theme]
  );

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        {item.bot.avatar_url ? (
          <Image source={{ uri: item.bot.avatar_url }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              { justifyContent: "center", alignItems: "center" },
            ]}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={24}
              color={theme.brand.normal}
            />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{item.bot.name}</Text>
          {/* Format time nicely later */}
          <Text style={styles.time}>
            {new Date(item.last_message_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.message} numberOfLines={1}>
          {item.last_message?.content || "No messages yet"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ChatListScreen = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      const data = await chatListService.getActiveChats();
      setChats(data);
    } catch (error) {
      console.error("Failed to fetch chats", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  const handlePress = (item: ChatListItem) => {
    navigation.navigate("ChatScreen", {
      chatId: item.id,
      botId: item.bot.id,
      botName: item.bot.name,
      botHandle: "", // Add handle if available in Bot type
      botAvatarUrl: item.bot.avatar_url,
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.background,
        },
        header: {
          paddingHorizontal: Spacing["spacing-layout-l"],
          paddingTop: Spacing["spacing-layout-m"],
          paddingBottom: Spacing["spacing-group-m"],
        },
        title: {
          ...Typography.presets.heading2,
          color: theme.textPrimary,
        },
        listContent: {
          paddingHorizontal: Spacing["spacing-layout-l"],
          paddingBottom: Spacing["spacing-layout-xl"],
        },
      }),
    [theme]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t("chat.title", { defaultValue: "Conversas" })}
        </Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItemRow
            item={item}
            onPress={() => handlePress(item)}
            theme={theme}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchChats();
            }}
            tintColor={theme.brand.normal}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text
                style={{
                  ...Typography.presets.bodyRegular.medium,
                  color: theme.textSecondary,
                }}
              >
                {t("chat.noChats", {
                  defaultValue: "Nenhuma conversa recente",
                })}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

export default ChatListScreen;
