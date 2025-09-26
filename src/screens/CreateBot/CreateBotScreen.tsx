
import React, { useRef, useState } from 'react';
import { Alert, ScrollView, Text, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { getTheme, createCreateBotStyles } from './CreateBot.styles';
import { AvatarEditable } from '../../components/shared/AvatarEditable';
import { FormField } from '../../components/shared/FormField';
import { SettingValueRow } from '../../components/shared/SettingValueRow';
import { FloatingMenu, type Anchor } from '../../components/shared/FloatingMenu';
import { useFadeSlideIn, AnimatedPressable } from '../../components/shared/Motion';

const CreateBotScreen: React.FC = () => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createCreateBotStyles(t);
  const navigation = useNavigation<any>();

  const [name, setName] = useState('Bot');
  const [prompt, setPrompt] = useState('Prompt...');
  const [voice, setVoice] = useState('RadiantMaiden');
  const [language, setLanguage] = useState('English');
  const [publicity, setPublicity] = useState('Anyone');

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);
  const [menuKind, setMenuKind] = useState<'voice'|'language'|'publicity'|null>(null);

  const openMenu = (kind: 'voice'|'language'|'publicity') => (anchor: Anchor) => { setMenuKind(kind); setMenuAnchor(anchor); setMenuOpen(true); };

  const onSelect = (val: string) => { if (menuKind === 'voice') setVoice(val); if (menuKind === 'language') setLanguage(val); if (menuKind === 'publicity') setPublicity(val); };

  const topAnim = useFadeSlideIn({ dy: -8, duration: 280 });
  const ctaScale = useRef(new Animated.Value(1)).current;

  const onClose = () => { if (navigation.canGoBack()) navigation.goBack(); else navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'AllChats' }] })); };

  const onCreate = () => {
    Animated.sequence([
      Animated.spring(ctaScale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }),
      Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 12 }),
    ]).start();
    Alert.alert('Create bot', 'Mock');
  };

  return (
    <SafeAreaView style={s.screen} edges={['top','bottom']}>
      <Animated.View style={topAnim}>
        <View style={s.topBar}>
          <View style={s.topLeft}>
            <AnimatedPressable onPress={onClose}>
              <Text style={s.closeText}>{'\u2715'}</Text>
            </AnimatedPressable>
          </View>
          <View style={s.topCenter}><Text style={s.titleText}>Create a bot</Text></View>
          <View style={s.topRight} />
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.avatarBlock}><AvatarEditable /></View>
        <FormField label="Name" value={name} onChangeText={setName} />
        <FormField label="Prompt" value={prompt} onChangeText={setPrompt} multiline />
        <View style={{ backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
          <SettingValueRow icon={'\uD83D\uDD0A'} label="Voice" value={voice} onPressRight={openMenu('voice')} />
          <View style={{ height: 0.5, backgroundColor: t.border, width: '100%' }} />
          <SettingValueRow icon={'\uD83C\uDF10'} label="Language" value={language} onPressRight={openMenu('language')} />
          <View style={{ height: 0.5, backgroundColor: t.border, width: '100%' }} />
          <SettingValueRow icon={'\uD83D\uDC65'} label="Publicity" value={publicity} onPressRight={openMenu('publicity')} />
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16 }}>
        <AnimatedPressable onPress={onCreate} style={{ transform: [{ scale: ctaScale }] }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: t.brand.normal }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Create bot</Text>
          </View>
        </AnimatedPressable>
      </View>

      <FloatingMenu visible={menuOpen} onClose={() => setMenuOpen(false)} anchor={menuAnchor} options={[]} selected={''} onSelect={onSelect} />
    </SafeAreaView>
  );
};

export default CreateBotScreen;
