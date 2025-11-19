import { useState, useCallback } from 'react';
import { Keyboard } from 'react-native';
import { useAttachmentPicker } from '../../../hooks/useAttachmentPicker';
import { AttachmentPickerResult } from '../../../services/attachmentService';

export const useChatMediaLogic = () => {
  // --- Estados Visuais ---
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // --- Estado de Dados ---
  // Array temporário que segura os arquivos antes do usuário clicar em "Enviar"
  const [selectedAttachments, setSelectedAttachments] = useState<AttachmentPickerResult[]>([]);

  // Hook global de acesso ao sistema de arquivos
  const { pickImage, pickDocument, takePhoto, isPickerLoading } = useAttachmentPicker();

  // --- Handlers de Ação ---

  const handleAttachPress = useCallback(() => {
    Keyboard.dismiss();
    setAttachmentMenuVisible(true);
  }, []);

  const handleCameraPress = useCallback(async () => {
    const result = await takePhoto();
    if (result) {
      setSelectedAttachments(prev => [...prev, ...result]);
    }
    // Fecha o menu após tirar a foto (opcional, depende da UX desejada)
    setAttachmentMenuVisible(false);
  }, [takePhoto]);

  const handleImageSelected = useCallback(async () => {
    const result = await pickImage();
    if (result) {
      setSelectedAttachments(prev => [...prev, ...result]);
    }
    setAttachmentMenuVisible(false);
  }, [pickImage]);

  const handleDocumentSelected = useCallback(async () => {
    const result = await pickDocument();
    if (result) {
      setSelectedAttachments(prev => [...prev, ...result]);
    }
    setAttachmentMenuVisible(false);
  }, [pickDocument]);

  const handleRemoveAttachment = useCallback((uriToRemove: string) => {
    setSelectedAttachments(prev => prev.filter(att => att.uri !== uriToRemove));
  }, []);

  const clearAttachments = useCallback(() => {
    setSelectedAttachments([]);
  }, []);

  // --- Handlers de Visualização (Modal) ---
  
  const handleImagePress = useCallback((imageUrl: string) => {
    setViewingImageUrl(imageUrl);
  }, []);

  const handleCloseImageViewer = useCallback(() => {
    setViewingImageUrl(null);
  }, []);

  return {
    // Estados
    attachmentMenuVisible,
    setAttachmentMenuVisible, // Exposto caso precise fechar manualmente via backdrop
    selectedAttachments,
    viewingImageUrl,
    isPickerLoading,

    // Métodos para UI (Botões e Menus)
    onAttachPress: handleAttachPress,
    onCameraPress: handleCameraPress,
    onImageSelected: handleImageSelected,
    onDocumentSelected: handleDocumentSelected,
    
    // Métodos de Gerenciamento
    onRemoveAttachment: handleRemoveAttachment,
    clearAttachments,
    
    // Métodos do Visualizador
    onImagePress: handleImagePress,
    onCloseImageViewer: handleCloseImageViewer,
  };
};