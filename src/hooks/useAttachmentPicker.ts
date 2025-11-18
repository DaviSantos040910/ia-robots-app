import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import { AttachmentPickerResult } from '../services/attachmentService';

export type PickerType = 'image' | 'document';

export const useAttachmentPicker = () => {
  const [isPickerLoading, setIsPickerLoading] = useState(false);

  /**
   * Solicita permissões necessárias
   */
  const requestPermissions = async (type: PickerType): Promise<boolean> => {
    if (type === 'image') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Por favor, permita acesso à galeria de fotos nas configurações.'
        );
        return false;
      }
    }
    return true;
  };

  /**
   * Abre o seletor de imagens
   * ✅ RETORNA ARRAY DE ANEXOS
   */
  const pickImage = async (): Promise<AttachmentPickerResult[] | null> => {
    try {
      setIsPickerLoading(true);
      const hasPermission = await requestPermissions('image');
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8, // Comprime para reduzir tamanho
        exif: false,
        allowsMultipleSelection: true, // ✅ HABILITA SELEÇÃO MÚLTIPLA
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Mapeia todos os assets selecionados para o nosso formato
        return result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type === 'image' ? 'image/jpeg' : undefined,
          size: asset.fileSize,
        }));
      }

      return null;
    } catch (error) {
      console.error('[AttachmentPicker] Image picker error:', error);
      Alert.alert('Erro', 'Não foi possível selecionar as imagens');
      return null;
    } finally {
      setIsPickerLoading(false);
    }
  };

  /**
   * Abre o seletor de documentos
   * ✅ RETORNA ARRAY DE ANEXOS
   */
  const pickDocument = async (): Promise<AttachmentPickerResult[] | null> => {
    try {
      setIsPickerLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Permite qualquer tipo de arquivo
        copyToCacheDirectory: true,
        multiple: true, // ✅ HABILITA SELEÇÃO MÚLTIPLA
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Mapeia todos os assets selecionados
        return result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
          size: asset.size,
        }));
      }

      return null;
    } catch (error) {
      console.error('[AttachmentPicker] Document picker error:', error);
      Alert.alert('Erro', 'Não foi possível selecionar os arquivos');
      return null;
    } finally {
      setIsPickerLoading(false);
    }
  };

  /**
   * Abre a câmera para tirar foto
   * ✅ RETORNA ARRAY DE ANEXOS (com 1 item)
   */
  const takePhoto = async (): Promise<AttachmentPickerResult[] | null> => {
    try {
      setIsPickerLoading(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Por favor, permita acesso à câmera nas configurações.'
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // ✅ Retorna como um array para consistência
        return [{
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize,
        }];
      }

      return null;
    } catch (error) {
      console.error('[AttachmentPicker] Camera error:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
      return null;
    } finally {
      setIsPickerLoading(false);
    }
  };

  return {
    pickImage,
    pickDocument,
    takePhoto,
    isPickerLoading,
  };
};
