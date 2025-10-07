// src/screens/CreateBot/CreateBot.styles.ts
import { StyleSheet } from 'react-native';
import { NeutralColors } from '../../theme/neutralColors';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Radius } from '../../theme/radius';
import { Typography } from '../../theme/typography';

export const getTheme = (isDark: boolean) => {
  const font = isDark
    ? { primary: NeutralColors.fontAndIcon.dark.wh1, secondary: NeutralColors.fontAndIcon.dark.wh2, placeholder: NeutralColors.fontAndIcon.dark.wh3, disabled: NeutralColors.fontAndIcon.dark.wh4 }
    : NeutralColors.fontAndIcon.light as any;

  const background = isDark ? NeutralColors.neutral.dark.gray1 : NeutralColors.neutral.light.gray1;
  const surface = isDark ? NeutralColors.neutral.dark.gray2 : NeutralColors.neutral.light.white1;
  const border = isDark ? NeutralColors.neutral.dark.gray3 : NeutralColors.neutral.light.gray2;
  
  // --- CORREÇÃO APLICADA AQUI ---
  // A cor 'surfaceAlt' (surface alternative) estava em falta.
  // É usada para fundos de elementos com um contraste ligeiramente diferente, como os nossos chips.
  const surfaceAlt = isDark ? NeutralColors.neutral.dark.gray3 : NeutralColors.neutral.light.gray2;

  return {
    isDark,
    background,
    surface,
    surfaceAlt, // Adicionada ao objeto retornado
    border,
    textPrimary: (font as any).primary,
    textSecondary: (font as any).secondary,
    brand: { normal: Colors.brand.light.normal },
    danger: { normal: Colors.semantic.error.normal },
  } as const;
};
export type CreateBotTheme = ReturnType<typeof getTheme>;

export const createCreateBotStyles = (t: CreateBotTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },
  scrollViewContent: {
    paddingHorizontal: Spacing['spacing-group-s'],
    paddingBottom: Spacing['spacing-group-l'],
  },

  // Top navigation bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['spacing-element-m'], height: 56 },
  closeBtn: { position: 'absolute', left: Spacing['spacing-element-m'], width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { ...Typography.titleSemiBold.large, color: t.textPrimary, fontSize: 18 },

  // Avatar section
  avatarContainer: { alignItems: 'center', marginVertical: Spacing['spacing-group-m'] },
  avatarWrapper: { width: 120, height: 120, borderRadius: 60, backgroundColor: t.border, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.brand.light.normal,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: t.surface,
  },

  // Form sections (cards)
  formSection: {
    backgroundColor: t.surface,
    borderRadius: Radius.xLarge,
    paddingVertical: Spacing['spacing-element-s'],
    marginBottom: Spacing['spacing-group-m'],
  },

  // Name Input styles
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['spacing-group-s'],
    minHeight: 50,
  },
  nameInputLabel: {
    ...Typography.bodySemiBold.medium,
    color: t.textPrimary,
    marginRight: Spacing['spacing-group-s'],
  },
  nameTextInput: {
    ...Typography.bodyRegular.medium,
    color: t.textPrimary,
    flex: 1,
    backgroundColor: 'transparent',
    height: '100%',
  },

  // Labeled TextInput styles (for Prompt)
  labeledInputContainer: { paddingHorizontal: Spacing['spacing-group-s'] },
  labeledInputLabel: { ...Typography.bodyMedium.medium, color: t.textPrimary, fontSize: 16, marginBottom: 4 },
  labeledInputDescription: { ...Typography.bodyRegular.medium, color: t.textSecondary, marginBottom: Spacing['spacing-element-s'] },
  textInput: {
    ...Typography.bodyRegular.medium,
    color: t.textPrimary,
    backgroundColor: t.background,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing['spacing-element-m'],
    paddingVertical: Spacing['spacing-element-m'],
    minHeight: 50,
  },
  inputErrorText: { ...Typography.bodyRegular.small, color: t.danger.normal, marginTop: 4, paddingHorizontal: Spacing['spacing-group-s'] },
  descriptionInput: {
    minHeight: 50,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingTop: 0,
  },
  promptInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingTop: 0,
  },
  
  // --- Category Selector Styles ---
  categorySection: {
    backgroundColor: t.surface,
    borderRadius: Radius.xLarge,
    padding: Spacing['spacing-group-s'],
    marginBottom: Spacing['spacing-group-m'],
  },
  categoryLabel: {
    ...Typography.bodyMedium.medium,
    color: t.textPrimary,
    fontSize: 16,
    marginBottom: Spacing['spacing-element-l'],

  },
 
  categorySelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing['spacing-element-m'],
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: Radius.round,
    backgroundColor: t.surfaceAlt, // Agora 'surfaceAlt' existe
    borderWidth: 1,
    borderColor: t.border,
  },
  categoryChipActive: {
    backgroundColor: t.brand.normal,
    borderColor: t.brand.normal,
  },
  categoryText: {
    ...Typography.bodySemiBold.medium,
    color: t.textSecondary,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },

  // Settings rows
  settingsCard: { paddingVertical: 0, marginTop: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: Spacing['spacing-group-s'] + 40 + Spacing['spacing-element-l'] },
  createButtonContainer: { marginTop: Spacing['spacing-group-m'] },
});