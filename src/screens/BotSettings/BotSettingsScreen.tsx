
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { getTheme as getBotTheme, createBotSettingsStyles } from './BotSettings.styles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { SectionCard } from '../../components/shared/SectionCard';
import { Divider } from '../../components/shared/Divider';
import { Chip } from '../../components/shared/Chip';
import { ValueRow } from '../../components/settings/ValueRow';
import { LeadingIcon } from '../../components/shared/LeadingIcon';
import { FloatingMenu, type Anchor } from '../../components/shared/FloatingMenu';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Share, Alert } from 'react-native';
import { ScalePressable, useFadeSlideIn } from '../../components/shared/Motion';

 type Props = NativeStackScreenProps<RootStackParamList, 'BotSettings'>;
 type BotDetails = { id: string; name: string; handle: string; users: string; followers: string; voice: string; language: string; publicity: string; createdByMe: boolean };

const BotSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { botId } = route.params;
  const scheme = useColorScheme();
  const t = getBotTheme(scheme === 'dark');
  const s = createBotSettingsStyles(t);

  // Animations
  const topBarAnim = useFadeSlideIn({ dy: -8, duration: 280 });
  const idAnim = useFadeSlideIn({ delay: 80, dy: 12 });
  const settingsAnim = useFadeSlideIn({ delay: 140, dy: 12 });
  const dangerAnim = useFadeSlideIn({ delay: 200, dy: 12 });

  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState<BotDetails | null>(null);

  const [publicity, setPublicity] = useState<'Private' | 'Friends' | 'Public'>('Public');
  const [pubMenuOpen, setPubMenuOpen] = useState(false);
  const [pubAnchor, setPubAnchor] = useState<Anchor>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setTimeout(() => {
      if (!mounted) return;
      const createdByMe = true; // mock
      const currentPublicity: 'Private' | 'Friends' | 'Public' = 'Public';
      setBot({
        id: botId,
        name: 'Space traveler',
        handle: '@StarrySia',
        users: '56K monthly users',
        followers: '8.4K followers',
        voice: 'Energetic Youth',
        language: 'English',
        publicity: currentPublicity,
        createdByMe,
      });
      setPublicity(currentPublicity);
      setLoading(false);
    }, 220);
    return () => { mounted = false; };
  }, [botId]);

  if (loading || !bot) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={t.brand.normal} />
      </View>
    );
  }

  const shareBot = async () => {
    try { await Share.share({ message: `Check this bot ${bot.name} ${bot.handle}` }); } catch {}
  };

  const confirmDelete = () => {
    Alert.alert('Delete bot', 'This action will be handled by the backend.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {} },
    ]);
  };

  const confirmCleanUp = () => {
    Alert.alert(
      'Clean up full text',
      "This will clear the bot's full text (backend action).",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const openPubMenu = (anchor: Anchor) => { setPubAnchor(anchor); setPubMenuOpen(true); };

  const publicityOptions = [
    { label: 'Private', value: 'Private' },
    { label: 'Friends', value: 'Friends' },
    { label: 'Public', value: 'Public' },
  ];

  return (
    <SafeAreaView style={s.screen} edges={['top','bottom']}>
      {/* Top bar */}
      <Animated.View style={[s.topBar, topBarAnim]}>
        <View style={s.leftGroup}>
          <ScalePressable onPress={() => navigation.goBack()} hitSlop={10} style={s.backBtn}>
            <Text style={s.topIconText}>{'\u2039'}</Text>
          </ScalePressable>
        </View>
        <View style={s.rightGroup}>
          <ScalePressable onPress={shareBot} hitSlop={10} style={s.iconBtn}>
            <Text style={s.topIconText}>{'\u2934\uFE0F'}</Text>
          </ScalePressable>
          {bot.createdByMe && (
            <ScalePressable onPress={confirmDelete} hitSlop={10} style={s.iconBtn}>
              <Text style={[s.topIconText, { color: t.danger.normal }]}>{'\uD83D\uDDD1\uFE0F'}</Text>
            </ScalePressable>
          )}
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Identity card */}
        <Animated.View style={idAnim}>
          <SectionCard bg={t.surface} border={t.border} radius={12}>
            <View style={s.identityRow}>
              <View style={s.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{bot.name}</Text>
                <Text style={s.byline}>By {bot.handle}</Text>
                <View style={s.chipRow}>
                  <Chip label="featured" bg={t.surfaceAlt} fg={t.textPrimary} />
                  <Chip label="Popular" bg={t.surfaceAlt} fg={t.textPrimary} />
                </View>
                <Text style={s.statsText}>{bot.users} · {bot.followers}</Text>
              </View>
            </View>
          </SectionCard>
        </Animated.View>

        <View style={s.spacer16} />

        {/* Settings list */}
        <Animated.View style={settingsAnim}>
          <SectionCard bg={t.surface} border={t.border} radius={12}>
            <ValueRow label="Voice" value={bot.voice} color={t.textPrimary}
              leftIcon={<LeadingIcon glyph={'\uD83D\uDD0A'} />} />
            <Divider color={t.border} />
            <ValueRow label="Language" value={bot.language} color={t.textPrimary}
              leftIcon={<LeadingIcon glyph={'\uD83C\uDF10'} />} />
            <Divider color={t.border} />
            <ValueRow
              label="Publicity"
              value={publicity}
              color={t.textPrimary}
              leftIcon={<LeadingIcon glyph={'\uD83D\uDC65'} />}
              showChevronRight={bot.createdByMe}
              onPressRight={bot.createdByMe ? openPubMenu : undefined}
            />
          </SectionCard>
        </Animated.View>

        <View style={s.spacer16} />

        {/* Destructive label row */}
        <Animated.View style={dangerAnim}>
          <SectionCard bg={t.surface} border={t.border} radius={12}>
            <Pressable onPress={confirmCleanUp} style={s.destructiveRow}>
              <View style={s.destructiveLeft}>
                <View style={s.destructiveIconWrap}><Text style={s.destructiveIconText}>{'\uD83E\uDDF9'}</Text></View>
                <Text style={s.destructiveText}>Clean up the full text</Text>
              </View>
            </Pressable>
          </SectionCard>
        </Animated.View>
      </ScrollView>

      {/* Floating menu for publicity */}
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
