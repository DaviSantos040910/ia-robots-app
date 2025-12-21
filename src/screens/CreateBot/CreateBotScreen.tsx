// src/screens/CreateBot/CreateBotScreen.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Text,
  View,
  Animated,
  Image,
  TextInput,
  ActivityIndicator,
  Switch, // Import Switch
} from "react-native";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/navigation";
import { useFadeSlideIn, ScalePressable } from "../../components/shared/Motion";
import { getTheme, createCreateBotStyles } from "./CreateBot.styles";
import { LabeledTextInput } from "../../components/shared/LabeledTextInput";
import { GradientButton } from "../../components/shared/GradientButton";
import {
  createBotService,
  type CreateBotPayload,
} from "../../services/createBotService";
import { NeutralColors } from "../../theme/neutralColors";
import { BottomActionSheet } from "../../components/shared/BottomActionSheet";
import * as ImagePicker from "expo-image-picker";
import { exploreService, Category } from "../../services/exploreService"; // Import exploreService and Category type
import { CategorySelector } from "../../components/create/CategorySelector"; // Import the new component
import { Colors } from "../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Create">;

const CreateBotScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === "dark");
  const s = createCreateBotStyles(theme);

  // --- State for Bot Creation Form ---
  const [botName, setBotName] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [botPrompt, setBotPrompt] = useState("");
  // --- NEW: State for Web Search ---
  const [allowWebSearch, setAllowWebSearch] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // --- State for Categories ---
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // --- UI and Validation State ---
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [promptError, setPromptError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [isAvatarActionSheetVisible, setIsAvatarActionSheetVisible] =
    useState(false);

  // --- Staggered Animations for a professional feel ---
  const headerAnim = useFadeSlideIn({ dy: -8, duration: 280 });
  const avatarAnim = useFadeSlideIn({ delay: 80, dy: 12 });
  const nameInputAnim = useFadeSlideIn({ delay: 140, dy: 12 });
  const descriptionInputAnim = useFadeSlideIn({ delay: 200, dy: 12 });
  const promptInputAnim = useFadeSlideIn({ delay: 200, dy: 12 });
  const categoryAnim = useFadeSlideIn({ delay: 260, dy: 12 });
  const webSearchAnim = useFadeSlideIn({ delay: 290, dy: 12 }); // Animation for web search
  const buttonAnim = useFadeSlideIn({ delay: 380, dy: 12 });

  // --- Data Fetching: Load categories when the screen mounts ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await exploreService.getCategories();
        setAllCategories(categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        Alert.alert(
          t("common.error"),
          t("createBot.categoriesLoadErrorMessage")
        );
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [t]);

  // --- Handlers ---

  const handleToggleCategory = useCallback(
    (id: string) => {
      if (categoryError) setCategoryError("");

      setSelectedCategoryIds((prevIds) => {
        if (prevIds.includes(id)) {
          return prevIds.filter((prevId) => prevId !== id);
        } else if (prevIds.length < 3) {
          return [...prevIds, id];
        }
        return prevIds;
      });
    },
    [categoryError]
  );

  const handleCreateBot = async () => {
    let isValid = true;
    if (!botName.trim()) {
      setNameError(t("createBot.nameRequired"));
      isValid = false;
    } else {
      setNameError("");
    }
    if (!botPrompt.trim()) {
      setPromptError(t("createBot.promptRequired"));
      isValid = false;
    } else {
      setPromptError("");
    }
    if (selectedCategoryIds.length === 0) {
      setCategoryError(t("createBot.categoryRequired"));
      isValid = false;
    } else {
      setCategoryError("");
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const language = i18n.language || "pt-BR";
      const payload: CreateBotPayload = {
        name: botName.trim(),
        prompt: botPrompt.trim(),
        description: botDescription.trim(),
        avatarUrl,
        settings: { voice: "EnergeticYouth", publicity: "Public" },
        category_ids: selectedCategoryIds,
        allow_web_search: allowWebSearch, // Enviando estado do switch
        visibility: "PUBLIC",
        language,
        voiceId: "",
      };
      const newBot = await createBotService.createBot(payload);
      Alert.alert(
        t("createBot.creationSuccess"),
        t("createBot.creationSuccessMessage", { name: newBot.name }),
        [{ text: t("common.ok"), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Bot creation failed:", error);
      Alert.alert(t("createBot.creationError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseImageFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0)
      setAvatarUrl(result.assets[0].uri);
  }, []);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0)
      setAvatarUrl(result.assets[0].uri);
  }, []);

  return (
    <SafeAreaView style={s.screen} edges={["top", "bottom"]}>
      <Animated.View style={[s.topBar, headerAnim]}>
        <ScalePressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={s.closeBtn}
        >
          <Ionicons name="close" size={26} color={theme.textPrimary} />
        </ScalePressable>
        <Text style={s.topBarTitle}>{t("createBot.title")}</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={s.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[s.avatarContainer, avatarAnim]}>
          <View style={s.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatarImage} />
            ) : (
              <Ionicons
                name="camera-outline"
                size={50}
                color={theme.textSecondary}
              />
            )}
            <ScalePressable
              onPress={() => setIsAvatarActionSheetVisible(true)}
              style={s.editAvatarBtn}
            >
              <Ionicons
                name="pencil-outline"
                size={18}
                color={NeutralColors.neutral.light.white1}
              />
            </ScalePressable>
          </View>
        </Animated.View>

        <Animated.View style={[s.formSection, nameInputAnim]}>
          <View style={s.nameInputContainer}>
            <Text style={s.nameInputLabel}>{t("createBot.nameLabel")}</Text>
            <TextInput
              style={s.nameTextInput}
              placeholder={t("createBot.namePlaceholder")}
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
            label={t("createBot.descriptionLabel")}
            placeholder={t("createBot.descriptionPlaceholder")}
            value={botDescription}
            onChangeText={setBotDescription}
            maxLength={255}
            style={s.descriptionInput}
            multiline
          />
        </Animated.View>

        <Animated.View style={[s.formSection, promptInputAnim]}>
          <LabeledTextInput
            label={t("createBot.promptLabel")}
            placeholder={t("createBot.promptPlaceholder")}
            placeholderTextColor={theme.textSecondary}
            value={botPrompt}
            onChangeText={setBotPrompt}
            error={promptError}
            multiline
            style={s.promptInput}
            maxLength={2000}
          />
        </Animated.View>

        {/* --- Category Selection Section --- */}
        <Animated.View style={[s.categorySection, categoryAnim]}>
          <Text style={s.categoryLabel}>{t("createBot.categoryLabel")}</Text>
          {isLoadingCategories ? (
            <ActivityIndicator
              color={theme.brand.normal}
              style={{ alignSelf: "flex-start" }}
            />
          ) : (
            <CategorySelector
              allCategories={allCategories}
              selectedIds={selectedCategoryIds}
              onToggleCategory={handleToggleCategory}
            />
          )}
          {categoryError ? (
            <Text style={s.inputErrorText}>{categoryError}</Text>
          ) : null}
        </Animated.View>

        {/* --- NEW: Web Search Switch --- */}
        <Animated.View
          style={[
            s.formSection,
            {
              padding: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            },
            webSearchAnim,
          ]}
        >
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ ...s.nameInputLabel, marginBottom: 4 }}>
              {t("createBot.allowWebSearchTitle")}
            </Text>
            <Text style={{ ...s.labeledInputDescription, marginBottom: 0 }}>
              {t("createBot.allowWebSearchDescription")}
            </Text>
          </View>
          <Switch
            value={allowWebSearch}
            onValueChange={setAllowWebSearch}
            trackColor={{
              false: theme.border,
              true: Colors.brand.light.normal,
            }}
            thumbColor={NeutralColors.neutral.light.white1}
          />
        </Animated.View>

        <Animated.View style={[s.createButtonContainer, buttonAnim]}>
          <GradientButton
            title={t("createBot.createButton")}
            onPress={handleCreateBot}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </Animated.View>
      </ScrollView>

      {/* --- Action Sheets --- */}
      <BottomActionSheet
        visible={isAvatarActionSheetVisible}
        onClose={() => setIsAvatarActionSheetVisible(false)}
        title={t("createBot.avatarActionSheetTitle")}
        options={[
          { label: t("createBot.takeNewPhoto"), onPress: handleTakePhoto },
          {
            label: t("createBot.chooseFromGallery"),
            onPress: handleChooseImageFromGallery,
          },
        ]}
      />
    </SafeAreaView>
  );
};

export default CreateBotScreen;
