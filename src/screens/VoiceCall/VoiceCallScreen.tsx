import React, { useMemo } from 'react';
import { View, Text, StatusBar, Image, Pressable, useColorScheme, ActivityIndicator, Alert, StyleProp, ViewStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; 
import Animated, { useAnimatedStyle, withSpring, interpolate, Extrapolation } from 'react-native-reanimated';

import { RootStackParamList } from '../../types/navigation';
import { getTheme, createVoiceCallStyles } from './VoiceCall.styles';
import { useVoiceCallLogic, VoiceCallStatus } from './hooks/useVoiceCallLogic';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceCall'>;

const VoiceCallScreen: React.FC<Props> = ({ route, navigation }) => {
  const { botName, botAvatarUrl, chatId } = route.params;
  const { t } = useTranslation(); 
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  
  const theme = getTheme(isDark);
  const styles = createVoiceCallStyles(theme);

  const { 
    callState, 
    recordingState,
    startRecordingInCall, 
    stopRecordingAndSend, 
    cancelInteraction,
    feedbackText,
    audioLevel
  } = useVoiceCallLogic({
    chatId,
    onError: (msg) => Alert.alert(t('common.ops'), msg) 
  });

  const handleGoBack = () => {
    cancelInteraction(); 
    navigation.goBack();
  };

  // --- Animations ---
  const avatarAnimatedStyle = useAnimatedStyle(() => {
    if (callState !== 'RECORDING') {
        return { transform: [{ scale: withSpring(1) }] };
    }
    const scale = interpolate(audioLevel.value, [-60, -10], [1, 1.4], Extrapolation.CLAMP);
    return { transform: [{ scale: withSpring(scale, { damping: 10, stiffness: 100 }) }] };
  });

  const botSpeakingStyle = useAnimatedStyle(() => {
      // Pulsa suavemente quando o bot está falando
      return { 
        transform: [{ scale: withSpring(callState === 'SPEAKING' ? 1.05 : 1, { damping: 20 }) }] 
      };
  });

  // --- Dynamic Styles Helpers ---
  const getStatusConfig = (state: VoiceCallStatus, recState: string) => {
    if (recState === 'initializing') return { text: t('voiceCall.status.preparing'), color: theme.textSecondary };
    switch (state) {
      case 'RECORDING': return { text: t('voiceCall.status.listening'), color: theme.recordingColor };
      case 'PROCESSING': return { text: t('voiceCall.status.processing'), color: theme.brand.normal };
      case 'SPEAKING': return { text: t('voiceCall.status.speaking'), color: theme.speakingColor }; 
      default: return { text: t('voiceCall.status.idle'), color: theme.textSecondary };
    }
  };

  const statusConfig = useMemo(() => getStatusConfig(callState, recordingState), [callState, recordingState, theme, t]);
  
  // Bloqueia interação APENAS se estiver processando. 
  // Removido bloqueio durante 'initializing' para permitir cancelamento rápido se necessário,
  // ou mantido se for crítico esperar hardware. Vamos manter bloqueio apenas no processamento de rede/hardware pesado.
  const isBusy = callState === 'PROCESSING'; 

  // --- Computed Style Objects ---
  const avatarContainerStyle = useMemo(() => [
    styles.avatarContainer,
    { 
      borderColor: callState === 'SPEAKING' ? statusConfig.color : theme.border,
      borderWidth: callState === 'SPEAKING' ? 4 : 1,
    },
    callState === 'RECORDING' ? avatarAnimatedStyle : botSpeakingStyle
  ], [styles, callState, statusConfig.color, theme.border, avatarAnimatedStyle, botSpeakingStyle]);

  const primaryButtonStyle = useMemo(() => ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> => [
    styles.primaryButton,
    callState === 'RECORDING' && styles.primaryButtonRecording,
    isBusy && styles.primaryButtonDisabled,
    { transform: [{ scale: pressed ? 0.95 : 1 }] } // Feedback visual de toque no botão
  ], [styles, callState, isBusy]);

  const secondaryButtonStyle = useMemo(() => ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> => [
    styles.secondaryButton,
    { opacity: pressed ? 0.7 : 1 }
  ], [styles]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} animated />

      <View style={styles.infoContainer}>
        <Animated.View style={avatarContainerStyle}>
          {botAvatarUrl ? (
            <Image source={{ uri: botAvatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Feather name="user" size={64} color={theme.textSecondary} />
          )}
        </Animated.View>

        <Text style={styles.botName} numberOfLines={1}>{botName}</Text>
        
        <Text style={[
          styles.statusText, 
          { color: statusConfig.color },
          callState !== 'IDLE' && styles.statusTextBold
        ]}>
          {statusConfig.text}
        </Text>

        {!!feedbackText && (
           <View style={styles.feedbackContainer}>
             <Text style={styles.feedbackText}>"{feedbackText}"</Text>
           </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <Pressable
          onPress={handleGoBack}
          style={secondaryButtonStyle}
          accessibilityLabel={t('voiceCall.accessibility.close')}
          accessibilityRole="button"
        >
          <Feather name="x" size={24} color={theme.textPrimary} />
        </Pressable>

        <Pressable
          // onPressIn dispara imediatamente ao tocar, ideal para interromper o bot instantaneamente
          onPressIn={startRecordingInCall}
          onPressOut={stopRecordingAndSend}
          disabled={isBusy}
          accessibilityHint={recordingState === 'initializing' ? t('voiceCall.status.preparing') : undefined}
          style={primaryButtonStyle}
          accessibilityLabel={t('voiceCall.accessibility.mic')}
          accessibilityRole="button"
        >
            {isBusy || recordingState === 'initializing' ? (
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