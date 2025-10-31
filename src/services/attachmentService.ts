import api from './api';
import { ChatMessage } from '../types/chat';
import * as FileSystem from 'expo-file-system/legacy';
export type AttachmentType = 'image' | 'document' | 'other';

export interface AttachmentPickerResult {
  uri: string;
  name: string;
  type?: string;
  size?: number;
}

class AttachmentService {
  /**
   * Valida o tamanho do arquivo antes do upload
   */
  private async validateFileSize(uri: string, maxSizeMB: number = 10): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || !fileInfo.size) {
        throw new Error('Não foi possível obter informações do arquivo');
      }
      
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (fileInfo.size > maxSizeBytes) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      }
      
      return true;
    } catch (error) {
      console.error('[AttachmentService] Validation error:', error);
      throw error;
    }
  }

  /**
   * Faz upload de um anexo para o chat
   */
  async uploadAttachment(
    chatId: string,
    file: AttachmentPickerResult,
    onProgress?: (progress: number) => void
  ): Promise<ChatMessage[]> {
    try {
      // Valida tamanho antes do upload
      await this.validateFileSize(file.uri);

      // Cria FormData
      const formData = new FormData();
      
      // Adiciona o arquivo ao FormData
      // @ts-ignore - React Native permite passar objetos especiais para FormData
      formData.append('attachment', {
        uri: file.uri,
        name: file.name,
        type: file.type || 'application/octet-stream',
      });

      console.log(`[AttachmentService] Uploading to chat ${chatId}:`, file.name);

      // Faz o upload usando multipart/form-data
      const response = await api.post<ChatMessage[]>(
        `/api/v1/chats/${chatId}/messages/attach/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Opcional: track upload progress
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          },
        }
      );

      console.log('[AttachmentService] Upload successful:', response);
      return response;
    } catch (error: any) {
      console.error('[AttachmentService] Upload failed:', error);
      
      // Trata erros específicos do backend
      if (error.response?.data) {
        const errorMsg = error.response.data.attachment?.[0] || 
                        error.response.data.error || 
                        'Erro ao enviar arquivo';
        throw new Error(errorMsg);
      }
      
      throw new Error('Erro ao enviar arquivo. Verifique sua conexão.');
    }
  }

  /**
   * Determina o tipo de anexo baseado no MIME type
   */
  getAttachmentType(mimeType?: string): AttachmentType {
    if (!mimeType) return 'other';
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    
    return 'other';
  }
}

export const attachmentService = new AttachmentService();

