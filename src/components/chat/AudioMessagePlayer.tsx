import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator, 
  LayoutChangeEvent,
  GestureResponderEvent,
  useColorScheme 
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { getTheme } from '../../screens/Chat/Chat.styles';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

type AudioMessagePlayerProps = {
  uri: string;
  duration?: number; // Duração em ms (opcional, inicial)
  isUser: boolean;
};

export const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({ 
  uri, 
  duration: initialDuration = 0, 
  isUser 
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');

  // --- Estado do Player ---
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Começa carregando
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(initialDuration);
  const [barWidth, setBarWidth] = useState(0);

  // Cores dinâmicas baseadas em quem enviou a mensagem
  // Se for User (fundo colorido), usamos branco/transparente.
  // Se for Bot (fundo neutro), usamos cores do tema.
  const colors = isUser ? {
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
  };

  // --- Ciclo de Vida do Áudio ---

  useEffect(() => {
    let isMounted = true;
    let soundInstance: Audio.Sound | null = null;

    const loadAudio = async () => {
      try {
        // Configura modo de áudio para tocar alto mesmo no modo silencioso (iOS)
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          onPlaybackStatusUpdate
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
        if (isMounted) setIsLoading(false);
      }
    };

    if (uri) loadAudio();

    return () => {
      isMounted = false;
      if (soundInstance) {
        // Importante: Descarregar para liberar memória
        soundInstance.unloadAsync();
      }
    };
  }, [uri]);

  // --- Handlers ---

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis);
      if (status.durationMillis) setDurationMillis(status.durationMillis);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMillis(0);
        // Reinicia para o começo mas pausado
        sound?.setPositionAsync(0); 
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      // Se terminou, volta pro inicio antes de tocar
      if (positionMillis >= durationMillis) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
    }
  };

  const handleSeek = async (event: GestureResponderEvent) => {
    if (!sound || barWidth === 0 || !durationMillis) return;

    const { locationX } = event.nativeEvent;
    // Calcula porcentagem do toque (0 a 1)
    const percentage = Math.max(0, Math.min(1, locationX / barWidth));
    const seekPosition = percentage * durationMillis;

    setPositionMillis(seekPosition); // Update visual imediato (Optimistic)
    await sound.setPositionAsync(seekPosition);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  };

  // --- Formatação ---
  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- Renderização ---

  // Cálculo da largura da barra preenchida
  const progressPercent = durationMillis > 0 
    ? (positionMillis / durationMillis) * 100 
    : 0;

  return (
    <View style={styles.container}>
      {/* Botão Play/Pause */}
      <Pressable 
        onPress={handlePlayPause} 
        disabled={isLoading}
        style={styles.playButton}
        hitSlop={10}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.icon} />
        ) : (
          <Feather 
            name={isPlaying ? "pause" : "play"} 
            size={24} 
            color={colors.icon} 
          />
        )}
      </Pressable>

      {/* Barra de Progresso Interativa */}
      <View style={styles.progressContainer}>
        {/* Trilho (Track) */}
        <View 
          style={[styles.track, { backgroundColor: colors.track }]} 
          onLayout={handleLayout}
        >
          {/* Preenchimento (Fill) */}
          <View 
            style={[
              styles.fill, 
              { 
                width: `${progressPercent}%`, 
                backgroundColor: colors.fill 
              }
            ]} 
          />
          {/* Bolinha no final da barra (Thumb) */}
          <View 
            style={[
              styles.thumb, 
              { 
                left: `${progressPercent}%`,
                backgroundColor: colors.thumb,
                // Esconde a bolinha se estiver no 0% para estética
                opacity: progressPercent > 0 ? 1 : 0 
              }
            ]} 
          />
        </View>
        
        {/* Área de toque invisível por cima da barra para facilitar o seek */}
        <Pressable 
          style={styles.seekTouchArea} 
          onPress={handleSeek}
        />
      </View>

      {/* Contador de Tempo */}
      <Text style={[styles.durationText, { color: colors.text }]}>
        {isPlaying || positionMillis > 0 
          ? formatTime(positionMillis) 
          : formatTime(durationMillis)
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 220, // Largura mínima para não comprimir
  },
  playButton: {
    paddingRight: Spacing['spacing-element-m'],
  },
  progressContainer: {
    flex: 1,
    height: 30, // Altura da área de toque
    justifyContent: 'center',
    marginRight: Spacing['spacing-element-m'],
  },
  track: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: -4, // Centraliza verticalmente na track de 4px ((12 - 4) / 2 * -1)
    marginLeft: -6, // Centraliza o ponto no fim da barra
  },
  seekTouchArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  durationText: {
    ...Typography.bodyRegular.small,
    fontVariant: ['tabular-nums'], // Evita pulo dos números
    minWidth: 35,
    textAlign: 'right',
  }
});