
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { styles } from './LoginScreen.styles';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// Expressão regular para validação de senha
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// URL base da API fictícia (substituir pelo backend Django futuramente)
const API_BASE_URL = 'https://fake-server.com/api';

const LoginScreen = () => {
  const { t } = useTranslation();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!passwordRegex.test(password)) {
      Alert.alert(
        t('login.invalidPasswordTitle'),
        t('login.invalidPasswordMessage')
      );
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        identifier: emailOrUsername,
        password: password,
      });

      Alert.alert(t('login.successTitle'), `${t('login.welcome')}, ${response.data.username}`);
    } catch (error) {
      Alert.alert(t('login.failedTitle'), t('login.failedMessage'));
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/avatar.png')} style={styles.avatar} />

      <Text style={styles.title}>{t('login.greeting')}</Text>
      <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
      <Text style={styles.description}>{t('login.description')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('login.emailOrUsername')}
        placeholderTextColor={'#00000040'}
        value={emailOrUsername}
        onChangeText={setEmailOrUsername}
      />

      <TextInput
        style={styles.input}
        placeholder={t('login.password')}
        placeholderTextColor={'#00000040'}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
        <Text style={styles.signInText}>{t('login.signIn')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.altButton}>
        <Text style={styles.altButtonText}>{t('login.continueWithGoogle')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.altButton}>
        <Text style={styles.altButtonText}>{t('login.continueWithApple')}</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        {t('login.disclaimer.part1')}{' '}
        <Text style={styles.link}>{t('login.disclaimer.userAgreement')}</Text>{' '}
        {t('login.disclaimer.and')}{' '}
        <Text style={styles.link}>{t('login.disclaimer.privacyPolicy')}</Text>.
      </Text>
    </View>
  );
};

export default LoginScreen;
