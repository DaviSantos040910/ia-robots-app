import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import ChatListScreen from "../screens/ChatList/ChatListScreen";
import { ExploreScreen } from "../screens/Explore/ExploreScreen";
import CreateBotScreen from "../screens/CreateBot/CreateBotScreen";
import { BottomNav } from "../components/navigation/BottomNav";
import { MainTabParamList } from "../types/navigation";
import { useTranslation } from "react-i18next";
import { FEATURES } from "../config/featureFlags"; // Importando Flags

const Tab = createBottomTabNavigator<MainTabParamList>();

const CreateBotTabScreen: React.FC = (props) => {
  return <CreateBotScreen {...(props as any)} />;
};

const VoiceCallTabScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>{t("voiceCall.startFromChat")}</Text>
    </View>
  );
};

export const MainTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ title: t("mainTabs.chats") }} // "Espaços"
      />

      {/* Aba Explorar (Agora Biblioteca) */}
      {FEATURES.SHOW_EXPLORE_TAB && (
        <Tab.Screen
          name="Explore"
          component={ExploreScreen}
          options={{ title: t("mainTabs.explore") }} // "Biblioteca"
        />
      )}

      <Tab.Screen
        name="CreateBot"
        component={CreateBotTabScreen}
        options={{ title: t("mainTabs.create") }} // "Novo Doc"
      />

      {/* Aba de Voz (Ocultada por Flag) */}
      {FEATURES.SHOW_VOICE_CALL_TAB && (
        <Tab.Screen
          name="VoiceCall"
          component={VoiceCallTabScreen}
          options={{ title: t("mainTabs.voice") }}
        />
      )}
    </Tab.Navigator>
  );
};
