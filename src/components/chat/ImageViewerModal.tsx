import React from 'react';
import { Modal, View, Image, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ visible, imageUrl, onClose }) => {
  const insets = useSafeAreaInsets();

  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* StatusBar controlada para ficar escura/oculta durante a visualização */}
        <StatusBar barStyle="light-content" backgroundColor="black" />

        <Pressable style={styles.backdrop} onPress={onClose}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </Pressable>

        <Pressable 
          style={[styles.closeButton, { top: insets.top + 16 }]} 
          onPress={onClose}
          hitSlop={20}
        >
          <View style={styles.closeButtonBackground}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  closeButtonBackground: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
});