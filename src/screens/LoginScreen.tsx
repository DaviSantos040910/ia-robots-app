import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/auth/AuthProvider";
import { RootStackParamList } from "../types/navigation";
import { useTheme } from "../theme/colors";
import { Typography } from "../theme/typography";
import { Spacing } from "../theme/spacing";
import { FormField } from "../components/shared/FormField";
import { GradientButton } from "../components/shared/GradientButton";

// Assumindo que temos uma API de auth
import api from "../services/api";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.background,
          paddingHorizontal: Spacing["spacing-layout-l"],
          justifyContent: "center",
        },
        header: {
          alignItems: "center",
          marginBottom: Spacing["spacing-layout-xl"],
        },
        logo: {
          width: 80,
          height: 80,
          borderRadius: 20, // Rounded app icon style
          backgroundColor: theme.brand.normal,
          marginBottom: Spacing["spacing-group-s"],
        },
        title: {
          ...Typography.presets.heading2,
          color: theme.textPrimary,
          textAlign: "center",
          marginBottom: Spacing["spacing-element-xs"],
        },
        subtitle: {
          ...Typography.presets.bodyRegular.medium,
          color: theme.textSecondary,
          textAlign: "center",
        },
        form: {
          width: "100%",
        },
        forgotPassword: {
          alignSelf: "flex-end",
          marginBottom: Spacing["spacing-group-m"],
        },
        forgotPasswordText: {
          ...Typography.presets.caption,
          color: theme.brand.normal,
          fontWeight: "600",
        },
        footer: {
          flexDirection: "row",
          justifyContent: "center",
          marginTop: Spacing["spacing-layout-l"],
        },
        footerText: {
          ...Typography.presets.bodyRegular.small,
          color: theme.textSecondary,
        },
        signupText: {
          ...Typography.presets.bodyRegular.small,
          color: theme.brand.normal,
          fontWeight: "600",
          marginLeft: 4,
        },
      }),
    [theme]
  );

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }

    setLoading(true);
    try {
      // Exemplo de chamada real
      const data = (await api.post("/auth/login/", {
     identifier: email,
   password,
})) as { token: string; refresh: string };

const { token, refresh } = data;
await login(token, refresh);
      // Navigation is handled by AuthProvider state change usually, or explicitly:
      // navigation.replace('Main');
    } catch (error) {
      console.error(error);
      Alert.alert(t("common.error"), t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          {/* Placeholder Logo */}
          <View style={styles.logo} />
          <Text style={styles.title}>
            {t("auth.welcomeBack", { defaultValue: "Bem-vindo de volta" })}
          </Text>
          <Text style={styles.subtitle}>
            {t("auth.loginSubtitle", {
              defaultValue: "Entre para acessar seus cadernos",
            })}
          </Text>
        </View>

        <View style={styles.form}>
          <FormField
            label={t("auth.email", { defaultValue: "Email" })}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="nome@exemplo.com"
          />
          <FormField
            label={t("auth.password", { defaultValue: "Senha" })}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>
              {t("auth.forgotPassword", { defaultValue: "Esqueceu a senha?" })}
            </Text>
          </TouchableOpacity>

          <GradientButton
            title={t("auth.login", { defaultValue: "Entrar" })}
            onPress={handleLogin}
            loading={loading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t("auth.noAccount", { defaultValue: "Não tem uma conta?" })}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.signupText}>
              {t("auth.signUp", { defaultValue: "Cadastre-se" })}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
