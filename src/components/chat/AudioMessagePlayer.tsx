import React, { useEffect, useState, useMemo, memo } from 'react';
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
import { Colors } from '../../theme/colors'; // Import para cor de erro

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

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [hasError, setHasError] = useState(false); // --- NOVO: Estado de erro
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

  useEffect(() => {
    let isMounted = true;
    let soundInstance: Audio.Sound | null = null;

    const loadAudio = async () => {
      try {
        setHasError(false); // Reseta erro ao tentar nova URI
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          (status: AVPlaybackStatus) => {
             if (status.isLoaded) {
                setPositionMillis(status.positionMillis);
                if (status.durationMillis) setDurationMillis(status.durationMillis);
                setIsPlaying(status.isPlaying);

                if (status.didJustFinish) {
                    setIsPlaying(false);
                    setPositionMillis(0);
                    newSound.setPositionAsync(0); 
                }
             }
          }
        );
        
        soundInstance = newSound;

        if (isMounted) {
          setSound(newSound);
          setIsLoading(false);
          if (status.isLoaded && status.durationMillis) {
            setDurationMillis(status.durationMillis);
          }
        }
      } catch (error) {
        console.error('[AudioPlayer] Erro ao carregar áudio:', error);
        if (isMounted) {
            setIsLoading(false);
            setHasError(true); // --- ATIVA MODO DE ERRO
        }
      }
    };

    if (uri) loadAudio();

    return () => {
      isMounted = false;
      if (soundInstance) {
        soundInstance.unloadAsync();
      }
    };
  }, [uri]);

  const handlePlayPause = async () => {
    if (!sound || hasError) return;
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        if (positionMillis >= durationMillis) {
          await sound.setPositionAsync(0);
        }
        await sound.playAsync();
      }
    } catch (e) {
      console.error("Erro playback", e);
    }
  };

  const handleSeek = async (event: GestureResponderEvent) => {
    if (!sound || barWidth === 0 || !durationMillis || hasError) return;
    const { locationX } = event.nativeEvent;
    const percentage = Math.max(0, Math.min(1, locationX / barWidth));
    const seekPosition = percentage * durationMillis;
    setPositionMillis(seekPosition);
    await sound.setPositionAsync(seekPosition);
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
        disabled={isLoading || hasError}
        style={s.audioPlayButton}
        hitSlop={10}
        accessibilityLabel={hasError ? "Erro no áudio" : (isPlaying ? t('common.pause') : t('common.play'))}
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.icon} />
        ) : hasError ? (
          // --- ÍCONE DE ERRO ---
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
          disabled={hasError}
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