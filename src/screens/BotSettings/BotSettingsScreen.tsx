
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, Pressable, Share, Alert } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'BotSettings'>;
 type BotDetails = { id: string; name: string; handle: string; users: string; followers: string; voice: string; language: string; publicity: string; createdByMe: boolean };

export const BotSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { botId } = route.params;
  const scheme = useColorScheme();
  const t = getBotTheme(scheme === 'dark');
  const s = createBotSettingsStyles(t);

  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState<BotDetails | null>(null);

  // publicity state + menu
  const [publicity, setPublicity] = useState<'Private' | 'Friends' | 'Public'>('Public');
  const [pubMenuOpen, setPubMenuOpen] = useState(false);
  const [pubAnchor, setPubAnchor] = useState<Anchor>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Mock fetch. Backend will inform if user is creator and the current publicity.
    setTimeout(() => {
      if (!mounted) return;
      const createdByMe = true; // mock: treat as creator for now
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
    try {
      await Share.share({ message: `Check this bot ${bot.name} ${bot.handle}` });
    } catch {}
  };

  const confirmDelete = () => {
    Alert.alert("Delete bot", "This action will be handled by the backend.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {} },
    ]);
  };

  const confirmCleanUp = () => {
    Alert.alert(
      "Clean up full text",
      "This will clear the bot's full text (backend action).",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Proceed", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const openPubMenu = (anchor: Anchor) => {
    setPubAnchor(anchor);
    setPubMenuOpen(true);
  };

  const publicityOptions = [
    { label: 'Private', value: 'Private' },
    { label: 'Friends', value: 'Friends' },
    { label: 'Public', value: 'Public' },
  ];

  return (
    <SafeAreaView style={s.screen} edges={['top','bottom']}>
      {/* Top bar: back (left), share + conditional trash (right) */}
      <View style={s.topBar}>
        <View style={s.leftGroup}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={s.backBtn}>
            <Text style={s.topIconText}>{'‹'}</Text>
          </Pressable>
        </View>
        <View style={s.rightGroup}>
          <Pressable onPress={shareBot} hitSlop={10} style={s.iconBtn}>
            <Text style={s.topIconText}>{'⤴︎'}</Text>
          </Pressable>
          {bot.createdByMe && (
            <Pressable onPress={confirmDelete} hitSlop={10} style={s.iconBtn}>
              <Text style={[s.topIconText, { color: t.danger.normal }]}>{'🗑️'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Identity card */}
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

        <View style={s.spacer16} />

        {/* Settings list with leading icons */}
        <SectionCard bg={t.surface} border={t.border} radius={12}>
          <ValueRow label="Voice" value={bot.voice} color={t.textPrimary}
            leftIcon={<LeadingIcon glyph={'🔊'} />} />
          <Divider color={t.border} />
          <ValueRow label="Language" value={bot.language} color={t.textPrimary}
            leftIcon={<LeadingIcon glyph={'🌐'} />} />
          <Divider color={t.border} />
          <ValueRow
            label="Publicity"
            value={publicity}
            color={t.textPrimary}
            leftIcon={<LeadingIcon glyph={'👥'} />}
            showChevronRight={bot.createdByMe}
            onPressRight={bot.createdByMe ? openPubMenu : undefined}
          />
        </SectionCard>

        <View style={s.spacer16} />

        {/* Destructive label row (no chevron) */}
        <SectionCard bg={t.surface} border={t.border} radius={12}>
          <Pressable onPress={confirmCleanUp} style={s.destructiveRow}>
            <View style={s.destructiveLeft}>
              <View style={s.destructiveIconWrap}><Text style={s.destructiveIconText}>{'🧹'}</Text></View>
              <Text style={s.destructiveText}>Clean up the full text</Text>
            </View>
          </Pressable>
        </SectionCard>
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
