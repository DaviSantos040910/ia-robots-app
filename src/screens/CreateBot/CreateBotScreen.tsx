// src/screens/CreateBot/CreateBotScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  View,
  Animated,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather, Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { useFadeSlideIn, ScalePressable } from '../../components/shared/Motion';
import { getTheme, createCreateBotStyles } from './CreateBot.styles';
import { LabeledTextInput } from '../../components/shared/LabeledTextInput';
import { SettingRow, type AnchorCallback } from '../../components/settings/SettingRow';
import { FloatingMenu, type Anchor } from '../../components/shared/FloatingMenu';
import { GradientButton } from '../../components/shared/GradientButton';
import { createBotService, type CreateBotPayload } from '../../services/createBotService';
import { NeutralColors } from '../../theme/neutralColors';
import { BottomActionSheet } from '../../components/shared/BottomActionSheet';
import * as ImagePicker from 'expo-image-picker';
import { exploreService, Category } from '../../services/exploreService'; // Import exploreService and Category type
import { CategorySelector } from '../../components/create/CategorySelector'; // Import the new component

type Props = NativeStackScreenProps<RootStackParamList, 'Create'>;

const CreateBotScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createCreateBotStyles(theme);

  // --- State for Bot Creation Form ---
  const [botName, setBotName] = useState('');
  const [botDescription, setBotDescription] = useState(''); // NOVO: State para a descrição
  const [botPrompt, setBotPrompt] = useState('');
  const [botVoice, setBotVoice] = useState('EnergeticYouth');
  const [botPublicity, setBotPublicity] = useState<'Private' | 'Guests' | 'Public'>('Public');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // --- State for Categories ---
  // Holds all available categories fetched from the backend.
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  // Holds the IDs of the categories the user has selected.
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  // Manages the loading state while fetching categories.
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // --- UI and Validation State ---
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [promptError, setPromptError] = useState('');
  const [categoryError, setCategoryError] = useState(''); // For category selection validation.
  const [isAvatarActionSheetVisible, setIsAvatarActionSheetVisible] = useState(false);

  // --- Menu State (for Voice and Publicity dropdowns) ---
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const [voiceAnchor, setVoiceAnchor] = useState<Anchor>(null);
  const [pubMenuOpen, setPubMenuOpen] = useState(false);
  const [pubAnchor, setPubAnchor] = useState<Anchor>(null);

  // --- Staggered Animations for a professional feel ---
  const headerAnim = useFadeSlideIn({ dy: -8, duration: 280 });
  const avatarAnim = useFadeSlideIn({ delay: 80, dy: 12 });
  const nameInputAnim = useFadeSlideIn({ delay: 140, dy: 12 });
  const descriptionInputAnim = useFadeSlideIn({ delay: 200, dy: 12 }); // NOVO: Animação para a descrição
  const promptInputAnim = useFadeSlideIn({ delay: 200, dy: 12 });
  const categoryAnim = useFadeSlideIn({ delay: 260, dy: 12 }); // Animation for the new category section.
  const settingsAnim = useFadeSlideIn({ delay: 320, dy: 12 });
  const buttonAnim = useFadeSlideIn({ delay: 380, dy: 12 });

  // --- Data Fetching: Load categories when the screen mounts ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await exploreService.getCategories();
        setAllCategories(categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Optionally, show an alert to inform the user about the failure.
        Alert.alert("Error", "Could not load categories. Please try again later.");
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // --- Handlers ---

  // Toggles the selection of a category chip.
  // Enforces a maximum of 3 selected categories.
  const handleToggleCategory = useCallback((id: string) => {
    // Clear any previous validation error when the user interacts.
    if (categoryError) setCategoryError('');

    setSelectedCategoryIds(prevIds => {
      if (prevIds.includes(id)) {
        // If the category is already selected, deselect it.
        return prevIds.filter(prevId => prevId !== id);
      } else if (prevIds.length < 3) {
        // If not selected and the limit is not reached, select it.
        return [...prevIds, id];
      }
      // If the limit of 3 is reached, do nothing.
      return prevIds;
    });
  }, [categoryError]);

  // Validates the form and sends the data to the backend.
  const handleCreateBot = async () => {
    let isValid = true;
    if (!botName.trim()) { setNameError(t('createBot.nameRequired')); isValid = false; } else { setNameError(''); }
    if (!botPrompt.trim()) { setPromptError(t('createBot.promptRequired')); isValid = false; } else { setPromptError(''); }
    if (selectedCategoryIds.length === 0) { setCategoryError(t('createBot.categoryRequired')); isValid = false; } else { setCategoryError(''); }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const payload: CreateBotPayload = {
        name: botName.trim(),
        prompt: botPrompt.trim(),
        description: botDescription.trim(), // NOVO: Adicionar descrição ao payload
        avatarUrl,
        settings: { voice: botVoice, publicity: botPublicity },
        category_ids: selectedCategoryIds, // Include the selected category IDs in the payload.
      };
      const newBot = await createBotService.createBot(payload);
      Alert.alert(t('createBot.creationSuccess'), `Bot "${newBot.name}" created!`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      console.error('Bot creation failed:', error);
      Alert.alert(t('createBot.creationError'));
    } finally {
      setIsLoading(false);
    }
  };

  const openMenu = useCallback((setOpen: React.Dispatch<React.SetStateAction<boolean>>, setAnchor: React.Dispatch<React.SetStateAction<Anchor>>, anchor: AnchorCallback) => {
    setAnchor(anchor);
    setOpen(true);
  }, []);
  
  const handleChooseImageFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (!result.canceled && result.assets && result.assets.length > 0) setAvatarUrl(result.assets[0].uri);
  }, []);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (!result.canceled && result.assets && result.assets.length > 0) setAvatarUrl(result.assets[0].uri);
  }, []);
  
  const voiceOptions = [{ label: 'Energetic Youth', value: 'EnergeticYouth' }, { label: 'Calm Adult', value: 'CalmAdult' }];
  const publicityOptions = [
    { label: t('botSettings.publicityPrivate'), value: 'Private' },
    { label: t('botSettings.publicityGuests'), value: 'Guests' },
    { label: t('botSettings.publicityPublic'), value: 'Public' },
  ];

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <Animated.View style={[s.topBar, headerAnim]}>
        <ScalePressable onPress={() => navigation.goBack()} hitSlop={10} style={s.closeBtn}>
          <Feather name="x" size={26} color={theme.textPrimary} />
        </ScalePressable>
        <Text style={s.topBarTitle}>{t('createBot.title')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={s.scrollViewContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={[s.avatarContainer, avatarAnim]}>
          <View style={s.avatarWrapper}>
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={s.avatarImage} /> : <Ionicons name="camera-outline" size={50} color={theme.textSecondary} />}
            <ScalePressable onPress={() => setIsAvatarActionSheetVisible(true)} style={s.editAvatarBtn}>
              <Feather name="edit-2" size={18} color={NeutralColors.neutral.light.white1} />
            </ScalePressable>
          </View>
        </Animated.View>

        <Animated.View style={[s.formSection, nameInputAnim]}>
          <View style={s.nameInputContainer}>
            <Text style={s.nameInputLabel}>{t('createBot.nameLabel')}</Text>
            <TextInput
              style={s.nameTextInput}
              placeholder="e.g., Space Traveler"
              placeholderTextColor={theme.textSecondary}
              value={botName}
              onChangeText={setBotName}
              maxLength={50}
            />
          </View>
          {nameError ? <Text style={s.inputErrorText}>{nameError}</Text> : null}
        </Animated.View>
        <Animated.View style={[s.formSection, descriptionInputAnim]}>
          <LabeledTextInput
            label={t('createBot.descriptionLabel')}
            placeholder={t('createBot.descriptionPlaceholder')}
            value={botDescription}
            onChangeText={setBotDescription}
            maxLength={255} // Corresponde ao max_length do modelo
            style={s.descriptionInput}// Estilo para um campo de texto um pouco maior
            multiline
          />
        </Animated.View>

        <Animated.View style={[s.formSection, promptInputAnim]}>
          <LabeledTextInput
            label={t('createBot.promptLabel')}
            placeholder={t('createBot.promptPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={botPrompt}
            onChangeText={setBotPrompt}
            error={promptError}
            multiline
            style={s.promptInput}
            maxLength={2000}
          />
        </Animated.View>

        {/* --- NEW: Category Selection Section --- */}
        <Animated.View style={[s.categorySection, categoryAnim]}>
          <Text style={s.categoryLabel}>{t('createBot.categoryLabel')}</Text>
          {isLoadingCategories ? (
            <ActivityIndicator color={theme.brand.normal} style={{ alignSelf: 'flex-start' }} />
          ) : (
            <CategorySelector
              allCategories={allCategories}
              selectedIds={selectedCategoryIds}
              onToggleCategory={handleToggleCategory}
            />
          )}
          {categoryError ? <Text style={s.inputErrorText}>{categoryError}</Text> : null}
        </Animated.View>

        {/* --- Settings Section (Language removed) --- */}
        <Animated.View style={[s.formSection, s.settingsCard, settingsAnim]}>
          <SettingRow label={t('botSettings.voice')} value={botVoice} iconName="volume-2" iconBgColor="#4A90E2" onPress={(anchor) => openMenu(setVoiceMenuOpen, setVoiceAnchor, anchor)} />
          <View style={s.divider} />
          <SettingRow label={t('botSettings.publicity')} value={t(`botSettings.publicity${botPublicity}` as any)} iconName="settings" iconBgColor="#F5A623" onPress={(anchor) => openMenu(setPubMenuOpen, setPubAnchor, anchor)} />
        </Animated.View>

        <Animated.View style={[s.createButtonContainer, buttonAnim]}>
          <GradientButton title={t('createBot.createButton')} onPress={handleCreateBot} isLoading={isLoading} disabled={isLoading} />
        </Animated.View>
      </ScrollView>

      {/* --- Menus & Action Sheets --- */}
      <FloatingMenu visible={voiceMenuOpen} onClose={() => setVoiceMenuOpen(false)} anchor={voiceAnchor} options={voiceOptions} selected={botVoice} onSelect={(v) => { setBotVoice(v); setVoiceMenuOpen(false); }} />
      <FloatingMenu visible={pubMenuOpen} onClose={() => setPubMenuOpen(false)} anchor={pubAnchor} options={publicityOptions} selected={botPublicity} onSelect={(v) => { setBotPublicity(v as any); setPubMenuOpen(false); }} />
      <BottomActionSheet visible={isAvatarActionSheetVisible} onClose={() => setIsAvatarActionSheetVisible(false)} title={t('createBot.avatarActionSheetTitle')} options={[{ label: t('createBot.takeNewPhoto'), onPress: handleTakePhoto }, { label: t('createBot.chooseFromGallery'), onPress: handleChooseImageFromGallery }]} />
    </SafeAreaView>
  );
};

export default CreateBotScreen;