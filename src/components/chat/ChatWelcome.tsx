import React from 'react';
import { View, Text, Image, useColorScheme } from 'react-native';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { SuggestionChip } from './SuggestionChip';

interface ChatWelcomeProps {
  botAvatar?: string | null;
  welcomeText: string;
  suggestions: string[];
  onSuggestionPress: (suggestion: string) => void;
  showSuggestions: boolean; // Prop para controlar se mostra os chips ou não
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({
  botAvatar,
  welcomeText,
  suggestions,
  onSuggestionPress,
  showSuggestions,
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  return (
    <View>
      {/* Hero Avatar */}
      <View style={s.heroContainer}>
        <View style={s.heroAvatarRing}>
          <Image
            source={botAvatar ? { uri: botAvatar } : require('../../assets/avatar.png')}
            style={s.heroAvatarImage}
          />
        </View>
      </View>

      {/* Welcome Bubble */}
      <View style={s.welcomeBubble}>
        <Text style={s.bubbleText}>{welcomeText}</Text>
      </View>

      {/* Suggestions Stack */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={s.chipStack}>
          {suggestions.map((label, idx) => (
            <SuggestionChip
              key={`suggestion-${idx}`}
              label={label}
              onPress={() => onSuggestionPress(label)}
            />
          ))}
        </View>
      )}
    </View>
  );
};