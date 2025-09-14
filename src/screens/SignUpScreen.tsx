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
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { AntDesign } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { styles } from './SignUpScreen.styles';
import { Spacing } from '../theme/spacing';
import { Colors } from '../theme/colors';
import { NeutralColors } from '../theme/neutralColors';
// inside SignUpScreen component (replace handleSignUp)
import api from '../services/api'; // add near top imports
import { Alert } from 'react-native';
import type { RootStackParamList } from '../types/navigation';

type SignUpScreenProps = NativeStackScreenProps<RootStackParamList, 'SignUp'>;
type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const avatarSize = useMemo(
    () => Math.min(Math.max(width * 0.24, 80), 120),
    [width]
  );
  const vGap = useMemo(
    () => Math.min(Math.max(height * 0.02, Spacing['spacing-element-m']), Spacing['spacing-card-m']),
    [height]
  );

  const signUpSchema = yup.object().shape({
    name: yup
      .string()
      .required(t('validation.required', { field: t('signup.name') })),
    email: yup
      .string()
      .email(t('validation.email'))
      .required(t('validation.required', { field: t('signup.email') })),
    password: yup
      .string()
      .min(8, t('validation.password.minLength'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        t('validation.password.complexity')
      )
      .required(t('validation.required', { field: t('signup.password') })),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password'), null], t('validation.password.mismatch'))
      .required(t('validation.required', { field: t('signup.confirmPassword') })),
  });

  const validateForm = async () => {
    try {
      await signUpSchema.validate(formData, { abortEarly: false });
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

  const handleSignUp = async () => {
    Keyboard.dismiss();
    const isValid = await validateForm();
    if (!isValid) return;
  
    setIsLoading(true);
    try {
      // Prepare payload: use username instead of full name
      const payload = {
        username: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };
  
      // API call to register endpoint
      // POST /api/auth/register/ expected to return { message: "User registered. Please verify your email." }
      const res = await api.post('/auth/register/', payload);
  
      // Show confirmation and navigate user to login or a verify screen
      Alert.alert(
        'Registered',
        'Account created. Check your email for a verification link.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      // Map backend validation errors to form fields when possible
      const data = error.response?.data;
      if (data) {
        // If serializer returned field errors, set them
        const fieldErrors: any = {};
        if (data.username) fieldErrors.name = data.username.join(' ');
        if (data.email) fieldErrors.email = data.email.join(' ');
        if (data.password) fieldErrors.password = data.password.join(' ');
        if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
        else {
          Alert.alert('Error', data.detail || 'Signup failed. Try again.');
        }
      } else {
        Alert.alert('Error', 'Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === 'ios' ? 100 : 0}
          enableResetScrollToCoords={false}
        >
          <View style={[styles.scrollView, { paddingBottom: insets.bottom + vGap }]}>
            <Image
              source={require('../assets/avatar.png')}
              style={[styles.avatar, { width: avatarSize, height: avatarSize }]}
              resizeMode="contain"
            />

            <Text style={styles.title}>{t('signup.title')}</Text>
            <Text style={styles.subtitle}>{t('signup.subtitle')}</Text>

            <View style={styles.formGroup}>
              <TextInput
                style={[
                  styles.input,
                  errors.name && styles.inputError,
                ]}
                placeholder={t('signup.namePlaceholder')}
                placeholderTextColor={NeutralColors.fontAndIcon.light.placeholder}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.formGroup}>
              <TextInput
                style={[
                  styles.input,
                  errors.email && styles.inputError,
                ]}
                placeholder={t('signup.emailPlaceholder')}
                placeholderTextColor={NeutralColors.fontAndIcon.light.placeholder}
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.formGroup}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    errors.password && styles.inputError,
                  ]}
                  placeholder={t('signup.passwordPlaceholder')}
                  placeholderTextColor={NeutralColors.fontAndIcon.light.placeholder}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  disabled={isLoading}
                >
                  <Text style={styles.visibilityToggleText}>
                    {isPasswordVisible ? t('common.hide') : t('common.show')}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.formGroup}>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  placeholder={t('signup.confirmPasswordPlaceholder')}
                  placeholderTextColor={NeutralColors.fontAndIcon.light.placeholder}
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  secureTextEntry={!isConfirmPasswordVisible}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  disabled={isLoading}
                >
                  <Text style={styles.visibilityToggleText}>
                    {isConfirmPasswordVisible ? t('common.hide') : t('common.show')}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={NeutralColors.neutral.light.white1} size="small" />
              ) : (
                <Text style={styles.buttonText}>{t('signup.button')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('signup.haveAccount')} </Text>
              <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
                <Text style={styles.footerLink}>{t('signup.signIn')}</Text>
              </TouchableOpacity>
            </View>
            {/* Disclaimer */}
             <Text style={styles.disclaimer}>
              {t('login.disclaimer.part1')}{' '}
              <Text style={styles.link}>{t('login.disclaimer.userAgreement')}</Text>{' '}
              {t('login.disclaimer.and')}{' '}
               <Text style={styles.link}>{t('login.disclaimer.privacyPolicy')}</Text>
                </Text>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default SignUpScreen;
