import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, Pressable, useColorScheme, Platform, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../../types/navigation';
import { getTheme } from '../Chat/Chat.styles';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { useVoiceCallLogic, VoiceCallState } from './hooks/useVoiceCallLogic';
import { useFadeScale } from '../../components/shared/Motion';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceCall'>;

const VoiceCallScreen: React.FC<Props> = ({ route, navigation }) => {
  const { botName, botAvatarUrl, botHandle, chatId, botId } = route.params;
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = getTheme(isDark);

  // --- Hook de Lógica ---
  const { 
    callState, 
    startRecordingInCall, 
    stopRecordingAndSend, 
    cancelInteraction,
    feedbackText
  } = useVoiceCallLogic({
    chatId,
    onError: (msg) => Alert.alert('Ops', msg)
  });

  const handleGoBack = () => {
    cancelInteraction(); // Garante que para tudo ao sair
    navigation.goBack();
  };

  // --- Configuração Visual Baseada no Estado ---
  const statusConfig = useMemo(() => {
    switch (callState) {
      case 'RECORDING':
        return { text: 'Ouvindo...', color: '#FF4B4B' }; // Vermelho suave
      case 'PROCESSING':
        return { text: 'Pensando...', color: theme.brand.normal };
      case 'PLAYING':
        return { text: 'Falando...', color: '#10B981' }; // Verde
      case 'IDLE':
      default:
        return { text: 'Toque e segure para falar', color: theme.textSecondary };
    }
  }, [callState, theme]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} animated />

      {/* Área Superior: Avatar e Informações */}
      <View style={styles.infoContainer}>
        {/* Avatar Hero com Animação de Borda (Opcional/Simples por enquanto) */}
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

        {/* Nome e Handle */}
        <Text style={[styles.botName, { color: theme.textPrimary }]} numberOfLines={1}>
          {botName}
        </Text>
        
        {/* Status Dinâmico */}
        <Text style={[styles.statusText, { color: statusConfig.color, fontWeight: callState !== 'IDLE' ? '700' : '400' }]}>
          {statusConfig.text}
        </Text>

        {/* Texto de Feedback (Transcrição) - Aparece quando processando ou falando */}
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
        {/* Botão Secundário (Esquerda - Fechar) */}
        <Pressable
          onPress={handleGoBack}
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: theme.surfaceAlt, opacity: pressed ? 0.7 : 1 }
          ]}
          accessibilityLabel="Fechar chamada"
          accessibilityRole="button"
        >
          <Feather name="x" size={24} color={theme.textPrimary} />
        </Pressable>

        {/* Botão Principal (Centro - PTT) */}
        <Pressable
          onPressIn={startRecordingInCall}
          onPressOut={stopRecordingAndSend}
          disabled={callState === 'PROCESSING'} // Desabilita durante processamento
          style={({ pressed }) => [
            styles.primaryButton,
            { 
              backgroundColor: callState === 'RECORDING' ? '#FF4B4B' : theme.brand.normal,
              transform: [{ scale: pressed ? 1.1 : 1 }], // Cresce ao tocar
              opacity: callState === 'PROCESSING' ? 0.5 : 1
            }
          ]}
          accessibilityLabel="Toque e segure para falar"
          accessibilityRole="button"
        >
            {callState === 'PROCESSING' ? (
                <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
                <Feather name={callState === 'RECORDING' ? "mic" : "mic"} size={40} color="#FFFFFF" />
            )}
        </Pressable>

         {/* Espaçador invisível */}
         <View style={styles.secondaryButtonPlaceholder} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['spacing-layout-m'],
    paddingBottom: Spacing['spacing-layout-xl'],
  },
  avatarContainer: {
    width: 160,
    height: 160,
    borderRadius: 80, 
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: Spacing['spacing-layout-m'],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  botName: {
    ...Typography.title3, 
    textAlign: 'center',
    marginBottom: Spacing['spacing-element-xs'],
  },
  statusText: {
    ...Typography.bodyRegular.medium, 
    textAlign: 'center',
    marginTop: 4,
  },
  feedbackContainer: {
    marginTop: Spacing['spacing-layout-m'],
    paddingHorizontal: Spacing['spacing-group-m'],
    paddingVertical: Spacing['spacing-element-m'],
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  feedbackText: {
    ...Typography.bodyRegular.medium,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['spacing-layout-xl'],
    paddingBottom: Spacing['spacing-layout-xl'],
    paddingTop: Spacing['spacing-layout-m'],
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  primaryButton: {
    width: 88, 
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default VoiceCallScreen;