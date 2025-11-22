// src/components/create/CategorySelector.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useColorScheme } from 'react-native';
import { createCreateBotStyles, getTheme } from '../../screens/CreateBot/CreateBot.styles';
import { ScalePressable } from '../shared/Motion';
import { Category } from '../../services/exploreService';

// Removido código de LayoutAnimation / UIManager

interface CategorySelectorProps {
  allCategories: Category[];
  selectedIds: string[];
  onToggleCategory: (id: string) => void;
}

const CategoryChip: React.FC<{
  label: string;
  onPress: () => void;
  isSelected: boolean;
}> = ({ label, onPress, isSelected }) => {
  const theme = getTheme(useColorScheme() === 'dark');
  const s = createCreateBotStyles(theme);

  const handlePress = () => {
    // LayoutAnimation removido
    onPress();
  };

  return (
    <ScalePressable onPress={handlePress}>
      <View style={[s.categoryChip, isSelected && s.categoryChipActive]}>
        <Text style={[s.categoryText, isSelected && s.categoryTextActive]}>
          {label}
        </Text>
      </View>
    </ScalePressable>
  );
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  allCategories,
  selectedIds,
  onToggleCategory,
}) => {
  const theme = getTheme(useColorScheme() === 'dark');
  const s = createCreateBotStyles(theme);

  return (
    <View style={s.categorySelectorContainer}>
      {allCategories.map(category => (
        <CategoryChip
          key={category.id}
          label={category.name}
          isSelected={selectedIds.includes(category.id)}
          onPress={() => onToggleCategory(category.id)}
        />
      ))}
    </View>
  );
};