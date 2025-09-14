
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, Pressable, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { getTheme } from '../Chat/Chat.styles';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BotSettings'>;

type BotDetails = {
  id: string;
  name: string;
  handle: string;
  createdBy: string;
  category: string;
  users: number;
  followers: number;
  voiceType: string;
  language: string;
};

export const BotSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { botId } = route.params;
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState<BotDetails | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // MOCK: simula fetch no backend
    setTimeout(() => {
      if (!mounted) return;
      setBot({
        id: botId,
        name: 'Atlas AI',
        handle: 'atlas_ai',
        createdBy: 'Criado por @davi',
        category: 'Assistente & Produtividade',
        users: 12450,
        followers: 8800,
        voiceType: 'Neural • Feminina',
        language: 'PT-BR',
      });
      setLoading(false);
    }, 400);
    return () => { mounted = false; };
  }, [botId]);

  if (loading || !bot) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.brand.normal} />
      </View>
    );
  }

  const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <View style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderColor: theme.border }}>
      <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{String(value)}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header simples */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surface, borderBottomWidth: 0.5, borderColor: theme.border }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 18 }}>{'‹'}</Text>
        </Pressable>
        <Text style={{ fontWeight: '600', fontSize: 16, color: theme.textPrimary }}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Card do bot */}
        <View style={{ backgroundColor: theme.surface, borderWidth: 0.5, borderColor: theme.border, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.surfaceAlt, marginBottom: 12 }} />
          <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '600' }}>{bot.name}</Text>
          <Text style={{ color: theme.textSecondary, marginTop: 2 }}>@{bot.handle}</Text>

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.surfaceAlt, marginRight: 8 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 12 }}>{bot.voiceType}</Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.surfaceAlt }}>
              <Text style={{ color: theme.textPrimary, fontSize: 12 }}>{bot.language}</Text>
            </View>
          </View>
        </View>

        {/* Infos alimentadas pelo backend (mock) */}
        <View style={{ backgroundColor: theme.surface, borderWidth: 0.5, borderColor: theme.border, borderRadius: 16, paddingHorizontal: 16 }}>
          <InfoRow label="Criado por" value={bot.createdBy} />
          <InfoRow label="Categoria" value={bot.category} />
          <InfoRow label="Usuários" value={bot.users} />
          <InfoRow label="Seguidores" value={bot.followers} />
        </View>

        <View style={{ height: 24 }} />

        {/* Ações */}
        <Pressable onPress={() => Alert.alert('Excluir bot', 'Esta ação será controlada pelo backend.', [{ text: 'OK' }])}
          style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#E5484D' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Apagar bot</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default BotSettingsScreen;
