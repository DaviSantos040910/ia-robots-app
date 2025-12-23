import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/auth/AuthProvider"; // Assuming login exists here too
import { RootStackParamList } from "../types/navigation";
import { useTheme } from "../theme/colors";
import { Typography } from "../theme/typography";
import { Spacing } from "../theme/spacing";
import { FormField } from "../components/shared/FormField";
import { GradientButton } from "../components/shared/GradientButton";
import api from "../services/api";

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SignUp"
>;

const SignUpScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { login } = useAuth();
  const theme = useTheme();

  const [username, setUsername] = useState("");
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
        footer: {
          flexDirection: "row",
          justifyContent: "center",
          marginTop: Spacing["spacing-layout-l"],
        },
        footerText: {
          ...Typography.presets.bodyRegular.small,
          color: theme.textSecondary,
        },
        loginText: {
          ...Typography.presets.bodyRegular.small,
          color: theme.brand.normal,
          fontWeight: "600",
          marginLeft: 4,
        },
      }),
    [theme]
  );

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register/", { username, email, password });
      // Auto login after register
      const response = (await api.post("/auth/login/", {
        username,
        password,
      })) as { data: { access: string; refresh: string } };
      const { access, refresh } = response.data;
      await login(access, refresh);
    } catch (error) {
      console.error(error);
      Alert.alert(t("common.error"), t("auth.registerFailed"));
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
          <Text style={styles.title}>
            {t("auth.createAccount", { defaultValue: "Criar conta" })}
          </Text>
          <Text style={styles.subtitle}>
            {t("auth.signUpSubtitle", {
              defaultValue: "Comece a estudar com inteligência",
            })}
          </Text>
        </View>

        <View style={styles.form}>
          <FormField
            label={t("auth.username", { defaultValue: "Nome de usuário" })}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="Seu nome"
          />
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

          <GradientButton
            title={t("auth.signUp", { defaultValue: "Cadastrar" })}
            onPress={handleSignUp}
            loading={loading}
            style={{ marginTop: Spacing["spacing-group-m"] }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t("auth.hasAccount", { defaultValue: "Já tem uma conta?" })}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginText}>
              {t("auth.login", { defaultValue: "Entrar" })}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
