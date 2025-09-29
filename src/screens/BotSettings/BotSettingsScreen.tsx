// src/screens/BotSettings/BotSettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, Animated, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { getTheme as getBotTheme, createBotSettingsStyles } from './BotSettings.styles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { Chip } from '../../components/shared/Chip';
import { FloatingMenu, type Anchor } from '../../components/shared/FloatingMenu';
import { ScalePressable, useFadeSlideIn } from '../../components/shared/Motion';
import { botSettingsService, type BotDetails } from '../../services/botSettingsService';
import { SettingRow, type AnchorCallback } from '../../components/settings/SettingRow';

type Props = NativeStackScreenProps<RootStackParamList, 'BotSettings'>;

const BotSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { botId } = route.params;
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getBotTheme(scheme === 'dark');
  const s = createBotSettingsStyles(theme);

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState<BotDetails | null>(null);
  const [publicity, setPublicity] = useState<'Private' | 'Guests' | 'Public'>('Public');
  const [pubMenuOpen, setPubMenuOpen] = useState(false);
  const [pubAnchor, setPubAnchor] = useState<Anchor>(null);

  // --- Animations ---
  const topBarAnim = useFadeSlideIn({ dy: -8, duration: 280 });
  const idAnim = useFadeSlideIn({ delay: 80, dy: 12 });
  const settingsAnim = useFadeSlideIn({ delay: 140, dy: 12 });
  const dangerAnim = useFadeSlideIn({ delay: 200, dy: 12 });

  // --- Data Fetching & Handlers (sem alterações) ---
  useEffect(() => {
    let isMounted = true;
    const loadBotDetails = async () => {
      setLoading(true);
      try {
        const details = await botSettingsService.getBotDetails(botId);
        if (isMounted) {
          setBot(details);
          setPublicity(details.settings.publicity);
        }
      } catch (error) {
        console.error("Failed to fetch bot details:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadBotDetails();
    return () => { isMounted = false; };
  }, [botId]);

  const confirmDelete = () => {
    Alert.alert(t('botSettings.deleteTitle'), t('botSettings.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('botSettings.delete'), style: 'destructive', onPress: () => {} },
    ]);
  };

  const confirmCleanUp = () => {
    Alert.alert(t('botSettings.cleanupTitle'), t('botSettings.cleanupMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('botSettings.proceed'), style: 'destructive', onPress: () => {} },
    ]);
  };

  const openPubMenu = (anchor: AnchorCallback) => {
    setPubAnchor(anchor);
    setPubMenuOpen(true);
  };
  
  if (loading || !bot) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.brand.normal} />
      </View>
    );
  }

  const publicityOptions = [
    { label: t('botSettings.publicityPrivate'), value: 'Private' },
    { label: t('botSettings.publicityGuests'), value: 'Guests' },
    { label: t('botSettings.publicityPublic'), value: 'Public' },
  ];

  return (
    <SafeAreaView style={s.screen} edges={['top','bottom']}>
      <Animated.View style={[s.topBar, topBarAnim]}>
        <ScalePressable onPress={() => navigation.goBack()} hitSlop={10} style={s.iconBtn}>
          <Feather name="chevron-left" size={26} color={theme.textPrimary} />
        </ScalePressable>
        <View style={s.rightGroup}>
          <ScalePressable onPress={() => {}} hitSlop={10} style={s.iconBtn}>
            <Feather name="share" size={22} color={theme.textPrimary} />
          </ScalePressable>
          {bot.createdByMe && (
            <ScalePressable onPress={confirmDelete} hitSlop={10} style={s.iconBtn}>
              <Feather name="trash-2" size={22} color={theme.textPrimary} />
            </ScalePressable>
          )}
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={s.content}>
        <Animated.View style={idAnim}>
          <View style={s.identityCard}>
            <View style={s.avatar} />
            <Text style={s.title}>{bot.name}</Text>
            <Text style={s.byline}>{t('botSettings.by')} {bot.handle}</Text>
            <View style={s.chipRow}>
              {bot.tags.map(tag => (
                <Chip key={tag} label={tag.toUpperCase()} bg={theme.border} fg={theme.textSecondary} />
              ))}
            </View>
            <Text style={s.statsText}>
              {t('botSettings.monthlyUsers', { value: bot.stats.monthlyUsers })} · {t('botSettings.followers', { value: bot.stats.followers })}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[s.settingsCard, settingsAnim]}>
          <SettingRow label={t('botSettings.voice')} value={bot.settings.voice} iconName="volume-2" iconBgColor="#4A90E2" showChevron={false} />
          <View style={s.divider} />
          <SettingRow label={t('botSettings.language')} value={bot.settings.language} iconName="globe" iconBgColor="#50E3C2" showChevron={false} />
          <View style={s.divider} />
          <SettingRow
            label={t('botSettings.publicity')}
            value={t(`botSettings.publicity${publicity}` as any)}
            iconName="settings"
            iconBgColor="#F5A623"
            showChevron={bot.createdByMe}
            onPress={bot.createdByMe ? openPubMenu : undefined}
          />
        </Animated.View>

        {/* AJUSTE: A estrutura JSX já estava correta, o ajuste de estilo resolve o problema de layout. */}
        <Animated.View style={dangerAnim}>
          <View style={s.cleanupCard}>
            <ScalePressable onPress={confirmCleanUp} style={s.destructiveRow}>
              <View style={s.destructiveIconWrapper}>
                <FontAwesome5 name="broom" size={16} color={theme.danger.normal} />
              </View>
              <Text style={s.destructiveText}>{t('botSettings.cleanup')}</Text>
            </ScalePressable>
          </View>
        </Animated.View>
      </ScrollView>

      <FloatingMenu
        visible={pubMenuOpen}
        onClose={() => setPubMenuOpen(false)}
        anchor={pubAnchor}
        options={publicityOptions}
        selected={publicity}
        onSelect={(v) => setPublicity(v as any)}
      />
    </SafeAreaView>
  );
};

export default BotSettingsScreen;