import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { styles } from '../../screens/AllChats/AllChats.styles';

interface Chat {
  id: string;
  name: string;
  description: string;
  official: boolean;
}

interface Props {
  chat: Chat;
  highlighted?: boolean;
  onPress?: () => void; // ADICIONADO
}

const ChatCard: React.FC<Props> = ({ chat, highlighted, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.card, highlighted && styles.highlightedCard]}>
        <Image source={{ uri: 'https://via.placeholder.com/48' }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{chat.name}</Text>
            {chat.official && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Official</Text>
              </View>
            )}
          </View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.description}>
            {chat.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(ChatCard);
