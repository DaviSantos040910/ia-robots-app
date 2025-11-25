import React, { useMemo } from 'react';
import { View, Text, StatusBar, Image, Pressable, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // Import i18n

import { RootStackParamList } from '../../types/navigation';
import { getTheme, createVoiceCallStyles } from './VoiceCall.styles'; // Use novos estilos
import { useVoiceCallLogic } from './hooks/useVoiceCallLogic';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceCall'>;

const VoiceCallScreen: React.FC<Props> = ({ route, navigation }) => {
  const { botName, botAvatarUrl, chatId } = route.params;
  const { t } = useTranslation(); // Hook i18n
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  
  const theme = getTheme(isDark);
  const styles = createVoiceCallStyles(theme);

  // --- Hook de Lógica ---
  const { 
    callState, 
    startRecordingInCall, 
    stopRecordingAndSend, 
    cancelInteraction,
    feedbackText
  } = useVoiceCallLogic({
    chatId,
    onError: (msg) => Alert.alert(t('common.ops'), msg) // Traduzido
  });

  const handleGoBack = () => {
    cancelInteraction(); 
    navigation.goBack();
  };

  // --- Configuração Visual Baseada no Estado ---
  const statusConfig = useMemo(() => {
    switch (callState) {
      case 'RECORDING':
        return { text: t('voiceCall.status.listening'), color: '#FF4B4B' };
      case 'PROCESSING':
        return { text: t('voiceCall.status.processing'), color: theme.brand.normal };
      case 'PLAYING':
        return { text: t('voiceCall.status.speaking'), color: '#10B981' }; 
      case 'IDLE':
      default:
        return { text: t('voiceCall.status.idle'), color: theme.textSecondary };
    }
  }, [callState, theme, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} animated />

      {/* Área Superior: Avatar e Informações */}
      <View style={styles.infoContainer}>
        <View style={[
          styles.avatarContainer, 
          { 
            backgroundColor: theme.surfaceAlt, 
            borderColor: callState === 'PLAYING' ? statusConfig.color : theme.border,
            borderWidth: callState === 'PLAYING' ? 3 : 1
          }
        ]}>
          {botAvatarUrl ? (
            <Image source={{ uri: botAvatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Feather name="user" size={64} color={theme.textSecondary} />
          )}
        </View>

        <Text style={[styles.botName, { color: theme.textPrimary }]} numberOfLines={1}>
          {botName}
        </Text>
        
        <Text style={[styles.statusText, { color: statusConfig.color, fontWeight: callState !== 'IDLE' ? '700' : '400' }]}>
          {statusConfig.text}
        </Text>

        {!!feedbackText && (
           <View style={styles.feedbackContainer}>
             <Text style={[styles.feedbackText, { color: theme.textSecondary }]}>
               "{feedbackText}"
             </Text>
           </View>
        )}
      </View>

      {/* Rodapé: Controles */}
      <View style={styles.controlsContainer}>
        {/* Botão Secundário (Fechar) */}
        <Pressable
          onPress={handleGoBack}
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: theme.surfaceAlt, opacity: pressed ? 0.7 : 1 }
          ]}
          accessibilityLabel={t('voiceCall.accessibility.close')}
          accessibilityRole="button"
        >
          <Feather name="x" size={24} color={theme.textPrimary} />
        </Pressable>

        {/* Botão Principal (PTT) */}
        <Pressable
          onPressIn={startRecordingInCall}
          onPressOut={stopRecordingAndSend}
          disabled={callState === 'PROCESSING'}
          style={({ pressed }) => [
            styles.primaryButton,
            { 
              backgroundColor: callState === 'RECORDING' ? '#FF4B4B' : theme.brand.normal,
              transform: [{ scale: pressed ? 1.1 : 1 }],
              opacity: callState === 'PROCESSING' ? 0.5 : 1
            }
          ]}
          accessibilityLabel={t('voiceCall.accessibility.mic')}
          accessibilityRole="button"
        >
            {callState === 'PROCESSING' ? (
                <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
                <Feather name={callState === 'RECORDING' ? "mic" : "mic"} size={40} color="#FFFFFF" />
            )}
        </Pressable>

         <View style={styles.secondaryButtonPlaceholder} />
      </View>
    </SafeAreaView>
  );
};

export default VoiceCallScreen;