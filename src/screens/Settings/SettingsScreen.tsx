
import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";

import { createSettingsStyles, getThemeFunction } from "./Settings.styles";
import { RootStackParamList } from "../../types/navigation";
import { useAuth } from "../../contexts/auth/AuthProvider";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

// --- Components ---

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor?: string; // If we want to control background specifically
  label: string;
  value?: string;
  onPress?: () => void;
  showDivider?: boolean;
  theme: any;
  styles: any;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  iconColor,
  iconBgColor, // Optional override
  label,
  value,
  onPress,
  showDivider,
  theme,
  styles,
}) => {
  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={onPress}
      >
        <View
          style={[
            styles.rowIconContainer,
            { backgroundColor: iconBgColor || iconColor }, // Use direct color if bg not provided? Actually design has colored boxes.
          ]}
        >
          {/* In the design, the box has the color, and the icon is white. 
              Except maybe the Theme one which looks inverted or specific.
              Let's assume the passed color is the BACKGROUND of the box.
           */}
           <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>

        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>{label}</Text>
          <View style={styles.rowValueContainer}>
            {value && <Text style={styles.rowValue}>{value}</Text>}
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </View>
        </View>
      </Pressable>
      {showDivider && <View style={styles.divider} />}
    </View>
  );
};


const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { logout } = useAuth();

  const isDark = scheme === "dark";
  const theme = useMemo(() => getThemeFunction(isDark), [isDark]);
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLogout = async () => {
      // Implement logout confirmation if needed
      await logout();
      // Usually AuthProvider state change will trigger navigation to Login
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings.title", { defaultValue: "Settings" })}</Text>
        <View style={styles.backButton} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Section 1: Share */}
        <View style={styles.section}>
             <SettingsRow 
                icon="thumbs-up" 
                iconColor="#F87171" // Red/Rose
                label={t("settings.share", { defaultValue: "Share to friend" })}
                theme={theme}
                styles={styles}
                onPress={() => console.log("Share pressed")}
             />
        </View>

        {/* Section 2: General */}
        <View style={styles.section}>
             <SettingsRow 
                icon="moon" 
                iconColor="#6366F1" // Indigo
                label={t("settings.theme", { defaultValue: "Theme" })}
                value={isDark ? t("settings.dark", { defaultValue: "Dark mode" }) : t("settings.light", { defaultValue: "Light mode" })}
                showDivider
                theme={theme}
                styles={styles}
                onPress={() => console.log("Theme pressed")}
             />
             <SettingsRow 
                icon="text" 
                iconColor="#FBBF24" // Amber
                label={t("settings.fontSize", { defaultValue: "Font size" })}
                showDivider
                theme={theme}
                styles={styles}
                onPress={() => console.log("Font size pressed")}
             />
             <SettingsRow 
                icon="headset" 
                iconColor="#818CF8" // Light Indigo
                label={t("settings.feedback", { defaultValue: "Feedback" })}
                showDivider
                theme={theme}
                styles={styles}
                onPress={() => console.log("Feedback pressed")}
             />
             <SettingsRow 
                icon="information-circle-outline" // Using outline or filled
                iconColor="#22D3EE" // Cyan
                label={t("settings.about", { defaultValue: "About us" })}
                theme={theme}
                styles={styles}
                onPress={() => console.log("About pressed")}
             />
        </View>

        {/* Section 3: Account */}
        <View style={styles.section}>
             <SettingsRow 
                icon="person" 
                iconColor="#6366F1" // Indigo
                label={t("settings.account", { defaultValue: "Account" })}
                showDivider
                theme={theme}
                styles={styles}
                onPress={() => console.log("Account pressed")}
             />
             <SettingsRow 
                icon="log-out" 
                iconColor="#FBBF24" // Amber
                label={t("settings.logout", { defaultValue: "Log out" })}
                theme={theme}
                styles={styles}
                onPress={handleLogout}
             />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
            <Text style={styles.footerText}>Version: 2.3.4</Text>
            <Text style={styles.footerText}>Design by @StarrySia</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
