// src/components/chat/AudioMessagePlayer.tsx

import React, { useEffect, useState, useMemo, memo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  ActivityIndicator, 
  LayoutChangeEvent, 
  GestureResponderEvent, 
  useColorScheme, 
  ViewStyle 
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getTheme, createChatStyles } from '../../screens/Chat/Chat.styles';
import { Colors } from '../../theme/colors';

type AudioMessagePlayerProps = {
  uri: string;
  duration?: number; 
  isUser: boolean;
};

const AudioMessagePlayerComponent: React.FC<AudioMessagePlayerProps> = ({ 
  uri, 
  duration: initialDuration = 0, 
  isUser 
}) => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  // Refs para acesso seguro em callbacks assíncronos
  const soundRef = useRef<Audio.Sound | null>(null);
  const isMounted = useRef(true);

  const [isPlaying, setIsPlaying] = useState(false);
  // FASE 2.3: Inicia false, pois não carregamos mais automaticamente
  const [isLoading, setIsLoading] = useState(false); 
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(initialDuration);
  const [barWidth, setBarWidth] = useState(0);

  const colors = useMemo(() => (isUser ? {
    icon: '#FFFFFF',
    text: '#FFFFFF',
    track: 'rgba(255, 255, 255, 0.3)',
    fill: '#FFFFFF',
    thumb: '#FFFFFF'
  } : {
    icon: theme.textSecondary,
    text: theme.textSecondary,
    track: theme.surfaceAlt,
    fill: theme.brand.normal,
    thumb: theme.brand.normal
  }), [isUser, theme]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync(); // Libera memória
      }
    };
  }, []); // Array vazio, roda apenas no unmount

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!isMounted.current) return;

    if (status.isLoaded) {
      setPositionMillis(status.positionMillis);
      if (status.durationMillis) setDurationMillis(status.durationMillis);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMillis(0);
        if (soundRef.current) {
            soundRef.current.stopAsync();
        }
      }
    } else if (status.error) {
      console.error(`[AudioPlayer] Erro de playback: ${status.error}`);
      setHasError(true);
    }
  }, []);

  const loadAndPlaySound = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }, // Toca assim que carregar
        onPlaybackStatusUpdate
      );

      if (isMounted.current) {
        soundRef.current = newSound;
        setIsLoaded(true);
        setIsLoading(false);
        
        if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.durationMillis) setDurationMillis(status.durationMillis);
        }
      } else {
        // Se desmontou enquanto carregava
        newSound.unloadAsync();
      }

    } catch (error) {
      console.error('[AudioPlayer] Erro ao carregar:', error);
      if (isMounted.current) {
        setIsLoading(false);
        setHasError(true);
      }
    }
  };

  const handlePlayPause = async () => {
    if (isLoading) return; // Evita cliques duplos durante loading

    // 1. Se ainda não carregou, carrega e toca (Lazy Load)
    if (!soundRef.current) {
        await loadAndPlaySound();
        return;
    }

    // 2. Se já carregou, controla Play/Pause
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        if (positionMillis >= durationMillis && durationMillis > 0) {
          await soundRef.current.replayAsync();
        } else {
          await soundRef.current.playAsync();
        }
      }
    } catch (e) {
      console.error("[AudioPlayer] Erro playback:", e);
      setHasError(true);
    }
  };

  const handleSeek = async (event: GestureResponderEvent) => {
    // Se o usuário tentar buscar antes de carregar, carregamos primeiro? 
    // Ou bloqueamos? Bloquear é mais seguro UX para evitar comportamentos estranhos.
    if (!soundRef.current || !isLoaded || barWidth === 0 || !durationMillis || hasError) return;
    
    const { locationX } = event.nativeEvent;
    const percentage = Math.max(0, Math.min(1, locationX / barWidth));
    const seekPosition = percentage * durationMillis;
    
    setPositionMillis(seekPosition); 
    try {
        await soundRef.current.setPositionAsync(seekPosition);
    } catch (e) {
        console.warn("Seek failed", e);
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = durationMillis > 0 
    ? (positionMillis / durationMillis) * 100 
    : 0;

  const fillStyle: ViewStyle = useMemo(() => ({
    width: `${progressPercent}%`, 
    backgroundColor: hasError ? Colors.semantic.error.light : colors.fill 
  }), [progressPercent, colors.fill, hasError]);

  const thumbStyle: ViewStyle = useMemo(() => ({
    left: `${progressPercent}%`,
    backgroundColor: hasError ? 'transparent' : colors.thumb,
    opacity: progressPercent > 0 ? 1 : 0 
  }), [progressPercent, colors.thumb, hasError]);

  return (
    <View style={s.audioPlayerContainer}>
      <Pressable 
        onPress={handlePlayPause} 
        disabled={hasError} // Removemos isLoading do disabled para permitir mostrar o spinner dentro
        style={s.audioPlayButton}
        hitSlop={10}
        accessibilityLabel={hasError ? t('chat.audioError') : (isPlaying ? t('common.pause') : t('common.play'))}
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.icon} />
        ) : hasError ? (
          <Feather name="alert-circle" size={24} color={isUser ? '#ffcccc' : Colors.semantic.error.normal} />
        ) : (
          <Feather 
            name={isPlaying ? "pause" : "play"} 
            size={24} 
            color={colors.icon} 
          />
        )}
      </Pressable>

      <View style={s.audioProgressContainer}>
        <View 
          style={[s.audioTrack, { backgroundColor: colors.track }]} 
          onLayout={handleLayout}
        >
          <View style={[s.audioFill, fillStyle]} />
          {!hasError && <View style={[s.audioThumb, thumbStyle]} />}
        </View>
        
        <Pressable 
          style={s.audioSeekTouchArea} 
          onPress={handleSeek}
          disabled={!isLoaded || hasError} // Desabilita seek se não carregado
          accessibilityLabel={t('chat.accessibility.audioProgress')}
          accessibilityRole="adjustable"
        />
      </View>

      <Text style={[s.audioDurationText, { color: colors.text }]}>
        {hasError ? "--:--" : (isPlaying || positionMillis > 0 
          ? formatTime(positionMillis) 
          : formatTime(durationMillis))
        }
      </Text>
    </View>
  );
};

export const AudioMessagePlayer = memo(AudioMessagePlayerComponent, (prev, next) => {
    return prev.uri === next.uri && prev.isUser === next.isUser;
});