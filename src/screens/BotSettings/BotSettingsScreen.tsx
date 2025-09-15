
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, Pressable, Switch } from 'react-native';
import { useColorScheme } from 'react-native';
import { getTheme as getBotTheme, createBotSettingsStyles } from './BotSettings.styles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { SectionCard } from '../../components/shared/SectionCard';
import { Divider } from '../../components/shared/Divider';
import { Chip } from '../../components/shared/Chip';
import { ValueRow } from '../../components/settings/ValueRow';

 type Props = NativeStackScreenProps<RootStackParamList, 'BotSettings'>;
 type BotDetails = { id: string; name: string; handle: string; users: string; followers: string; voice: string; language: string; publicity: string; };

export const BotSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { botId } = route.params;
  const scheme = useColorScheme();
  const t = getBotTheme(scheme === 'dark');
  const s = createBotSettingsStyles(t);

  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState<BotDetails | null>(null);
  const [cleanText, setCleanText] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setTimeout(() => {
      if (!mounted) return;
      setBot({
        id: botId,
        name: 'Space traveler',
        handle: '@StarrySia',
        users: '56K monthly users',
        followers: '8.4K followers',
        voice: 'Energetic Youth',
        language: 'English',
        publicity: 'Anyone',
      });
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

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginRight: 12 }}>
          <Text style={s.headerBackText}>{'‹'}</Text>
        </Pressable>
        <Text style={s.headerTitle}>Bot settings</Text>
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

        {/* Settings list */}
        <SectionCard bg={t.surface} border={t.border} radius={12}>
          <ValueRow label="Voice" value={bot.voice} color={t.textPrimary} onPress={() => {}} />
          <Divider color={t.border} />
          <ValueRow label="Language" value={bot.language} color={t.textPrimary} onPress={() => {}} />
          <Divider color={t.border} />
          <ValueRow label="Publicity" value={bot.publicity} color={t.textPrimary} onPress={() => {}} />
        </SectionCard>

        <View style={s.spacer16} />

        {/* Toggle */}
        <SectionCard bg={t.surface} border={t.border} radius={12}>
          <View style={s.toggleRow}>
            <Text style={{ color: t.textPrimary }}>Clean up the full text</Text>
            <Switch value={cleanText} onValueChange={setCleanText} />
          </View>
        </SectionCard>
      </ScrollView>
    </View>
  );
};

export default BotSettingsScreen;
