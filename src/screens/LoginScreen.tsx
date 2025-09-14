// LoginScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { styles } from './LoginScreen.styles';
import { Spacing } from '../theme/spacing';
import { AntDesign } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AxiosResponse } from 'axios';
import { ChatBootstrap, ChatMessage } from '../types/chat'; // ajuste o caminho se necessário
import type { RootStackParamList } from '../types/navigation';


type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

type FormErrors = {
  emailOrUsername?: string;
  password?: string;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const navigateToSignUp = () => {
    navigation.navigate('SignUp' as never);
  };

  const avatarSize = useMemo(
    () => Math.min(Math.max(width * 0.24, 80), 120),
    [width]
  );
  const vGap = useMemo(
    () =>
      Math.min(
        Math.max(height * 0.02, Spacing['spacing-element-m']),
        Spacing['spacing-card-m']
      ),
    [height]
  );

  const loginSchema = yup.object().shape({
    emailOrUsername: yup
      .string()
      .required(t('validation.required', { field: t('login.emailOrUsername') })),
    password: yup
      .string()
      .min(8, t('validation.password.minLength'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        t('validation.password.complexity')
      )
      .required(t('validation.required', { field: t('login.password') })),
  });

  const validateForm = async () => {
    try {
      await loginSchema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err: any) {
      const validationErrors: FormErrors = {};
      err.inner.forEach((error: any) => {
        validationErrors[error.path as keyof FormErrors] = error.message;
      });
      setErrors(validationErrors);
      return false;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    const isValid = await validateForm();
    if (!isValid) return;

    setIsLoading(true);
    try {
      interface LoginResponse {
        token: string;
        refresh: string;
        user: { id: string; username: string; email: string; is_email_verified?: boolean };
      }

      const response = await api.post<LoginResponse>('/auth/login/', {
        identifier: formData.emailOrUsername.trim(),
        password: formData.password,
      });

      if (response?.token) {
        await SecureStore.setItemAsync('authToken', response.token);
        if (response.refresh) {
          await SecureStore.setItemAsync('refreshToken', response.refresh);
        }

        // Exemplo de bootstrap e messages para ChatScreen
        const bootstrapExample: ChatBootstrap = {
          conversationId: '123',
          bot: { name: 'Robo', handle: 'robo', avatarUrl: '' },
          welcome: 'Olá! Como posso ajudar?',
          suggestions: ['Oi', 'Como você está?', 'Me conte uma piada'],
        };
        const messagesExample: ChatMessage[] = [];

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'ChatScreen',
              params: {
                bootstrap: bootstrapExample,
                messages: messagesExample,
                onSendMessage: (text: string) => {
                  console.log('Mensagem enviada:', text);
                  // integração com backend aqui
                },
              },
            },
          ],
        });
      } else {
        setErrors({ ...errors, password: t('errors.generic') });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail ?? t('errors.generic');
      setErrors({ ...errors, password: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.emailOrUsername.trim()) {
      Alert.alert(t('errors.required'), t('login.enterEmailOrUsernameForReset'));
      return;
    }

    setIsLoading(true);
    try {
      const response: AxiosResponse = await api.post('/auth/forgot-password/', {
        email: formData.emailOrUsername.trim(),
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert(t('login.forgotPassword'), t('login.forgotPasswordSuccess'));
      } else {
        Alert.alert(t('login.forgotPassword'), t('login.forgotPasswordError'));
      }
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.detail ?? t('login.forgotPasswordError');
      Alert.alert(t('login.forgotPassword'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={Platform.select({ ios: Spacing['spacing-element-l'], android: 0 })}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + Spacing['spacing-element-s'],
            paddingBottom: insets.bottom + Spacing['spacing-element-l'],
          }}
          style={{ flex: 1 }}
        >
          <View style={[styles.contentSplit, styles.pagePadding]}>
            {/* Header */}
            <View style={styles.headerCenter}>
              <Image
                source={require('../assets/avatar.png')}
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                  marginBottom: vGap,
                }}
                accessibilityLabel={t('accessibility.avatar')}
              />
              <Text style={styles.title} accessibilityRole="header">
                {t('login.greeting')}
              </Text>
              <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
              <Text style={styles.description}>{t('login.description')}</Text>
            </View>

            {/* Form */}
            <View style={{ marginTop: vGap }}>
              <View style={styles.formGroup}>
                <TextInput
                  style={[styles.input, errors.emailOrUsername && styles.inputError]}
                  placeholder={t('login.emailOrUsername')}
                  placeholderTextColor="#00000040"
                  value={formData.emailOrUsername}
                  onChangeText={(text) => handleInputChange('emailOrUsername', text)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  autoComplete="username"
                  accessibilityLabel={t('login.emailOrUsername')}
                  accessibilityHint={t('accessibility.enterEmailOrUsername')}
                  editable={!isLoading}
                  returnKeyType="next"
                />
                {errors.emailOrUsername && <Text style={styles.errorText}>{errors.emailOrUsername}</Text>}
              </View>

              <View style={styles.formGroup}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    placeholder={t('login.password')}
                    placeholderTextColor="#00000040"
                    secureTextEntry={!isPasswordVisible}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    autoComplete="password"
                    accessibilityLabel={t('login.password')}
                    accessibilityHint={t('accessibility.enterPassword')}
                    editable={!isLoading}
                    onSubmitEditing={handleLogin}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.visibilityToggle}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    accessibilityLabel={isPasswordVisible ? t('accessibility.hidePassword') : t('accessibility.showPassword')}
                  >
                    <Text style={styles.visibilityToggleText}>
                      {isPasswordVisible ? t('common.hide') : t('common.show')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotInlineButton}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={t('login.forgotPassword')}
                >
                  <Text style={styles.forgotInlineText}>{t('login.forgotPassword')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions & Footer */}
            <View>
              <TouchableOpacity
                style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityState={{ disabled: isLoading }}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>{t('login.signIn')}</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.altButton, styles.googleButton]}
                onPress={() => handleSocialLogin('google')}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={t('login.continueWithGoogle')}
              >
                <AntDesign name="google" size={20} color="#fff" style={{ marginRight: Spacing['spacing-element-m'] }} />
                <Text style={[styles.altButtonText, styles.googleButtonText]}>{t('login.continueWithGoogle')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.altButton, styles.appleButton]}
                onPress={() => handleSocialLogin('apple')}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={t('login.continueWithApple')}
              >
                <AntDesign name="apple1" size={20} color="#fff" style={{ marginRight: Spacing['spacing-element-m'] }} />
                <Text style={[styles.altButtonText, styles.appleButtonText]}>{t('login.continueWithApple')}</Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>{t('signup.haveAccount')} </Text>
                <TouchableOpacity onPress={navigateToSignUp} disabled={isLoading}>
                  <Text style={styles.signupLink}>{t('signup.signIn')}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.disclaimer}>
                {t('login.disclaimer.part1')}{' '}
                <Text style={styles.link}>{t('login.disclaimer.userAgreement')}</Text>{' '}
                {t('login.disclaimer.and')}{' '}
                <Text style={styles.link}>{t('login.disclaimer.privacyPolicy')}</Text>
              </Text>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default LoginScreen;
