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
  // src/services/attachmentService.ts

async uploadAttachment(
  chatId: string,
  file: AttachmentPickerResult,
  content?: string,
  onProgress?: (progress: number) => void
): Promise<ChatMessage[]> {
  try {
    await this.validateFileSize(file.uri);

    const formData = new FormData();

    // @ts-ignore
    formData.append('attachment', {
      uri: file.uri,
      name: file.name,
      type: file.type || 'application/octet-stream',
    });

    if (content && content.trim()) {
      formData.append('content', content.trim());
    }

    console.log(`[AttachmentService] Uploading to chat ${chatId}:`, file.name, 
                content ? `with text: "${content}"` : 'without text');

    // ✅ CORREÇÃO: api.post já retorna T diretamente (não AxiosResponse<T>)
    const messages = await api.post<ChatMessage[]>(
      `/api/v1/chats/${chatId}/messages/attach/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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

    console.log('[AttachmentService] Upload successful');
    
    // ✅ Retorna diretamente (messages já é ChatMessage[])
    return messages;
    
  } catch (error: any) {
    console.error('[AttachmentService] Upload failed:', error);
    
    if (error.response?.data) {
      const errorMsg = error.response.data.attachment?.[0] ||
        error.response.data.content?.[0] ||
        error.response.data.detail ||
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

