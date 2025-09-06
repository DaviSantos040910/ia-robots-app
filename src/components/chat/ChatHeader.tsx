
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { useColorScheme } from 'react-native';

const BackIcon = () => <Text>{'‹'}</Text>;
const PhoneIcon = () => <Text>{'📞'}</Text>;
const VolumeIcon = () => <Text>{'🔊'}</Text>;
const MoreIcon = () => <Text>{'⋯'}</Text>;

 type Props = {
  avatarUrl?: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  onPhone: () => void;
  onVolume: () => void;
  onMore: () => void;
};

export const ChatHeader: React.FC<Props> = ({
  avatarUrl,
  title,
  subtitle,
  onBack,
  onPhone,
  onVolume,
  onMore,
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  return (
    <View style={s.headerContainer}>
      <View style={s.headerLeft}>
        <Pressable onPress={onBack} style={s.backButton} hitSlop={8}>
          <BackIcon />
        </Pressable>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={s.tinyAvatar} />
        ) : (
          <View style={s.tinyAvatar} />
        )}
        <View style={s.titleArea}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          {!!subtitle && (
            <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={s.headerRight}>
        <Pressable onPress={onPhone} style={s.iconButton} hitSlop={8}>
          <PhoneIcon />
        </Pressable>
        <Pressable onPress={onVolume} style={[s.iconButton, s.mlIcon]} hitSlop={8}>
          <VolumeIcon />
        </Pressable>
        <Pressable onPress={onMore} style={[s.iconButton, s.mlIcon]} hitSlop={8}>
          <MoreIcon />
        </Pressable>
      </View>
    </View>
  );
};
