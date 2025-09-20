import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AvatarSelector = () => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarEmoji}>🙂</Text>
      </View>
      <View style={styles.editButton}>
        <Text style={styles.editIcon}>✏️</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 48,
    color: '#C2B6FF',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6A4DFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});

export default AvatarSelector;
