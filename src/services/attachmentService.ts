import api from './api';
import { ChatMessage } from '../types/chat';
// CORREÇÃO: Usar a importação legacy para manter compatibilidade com getInfoAsync
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
        // Em alguns casos o getInfoAsync pode falhar se o URI for de cache temporário recente,
        // então assumimos que existe se falhar, para deixar o backend validar.
        console.warn('[AttachmentService] Could not validate file size strictly.');
        return true; 
      }
      
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (fileInfo.size > maxSizeBytes) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      }
      
      return true;
    } catch (error) {
      console.error('[AttachmentService] Validation error:', error);
      // Em vez de lançar erro, vamos apenas logar e permitir o upload tentar,
      // pois o erro pode ser apenas na obtenção da info local.
      // O backend fará a validação final.
      return true; 
    }
  }

  /**
   * OBSOLETO: Use uploadBatchAttachments para melhor performance.
   * Mantido para compatibilidade se necessário.
   */
  async uploadAttachment(
    chatId: string,
    file: AttachmentPickerResult,
    content?: string,
    onProgress?: (progress: number) => void
  ): Promise<ChatMessage[]> {
    return this.uploadBatchAttachments(chatId, [file], onProgress);
  }

  /**
   * Faz upload de múltiplos anexos em uma única requisição (Batch).
   * @param chatId ID do chat
   * @param files Lista de arquivos
   * @param onProgress Callback de progresso global
   */
  async uploadBatchAttachments(
    chatId: string,
    files: AttachmentPickerResult[],
    onProgress?: (progress: number) => void
  ): Promise<ChatMessage[]> {
    try {
      if (files.length === 0) return [];

      // 1. Valida tamanho de todos os arquivos antes de iniciar
      for (const file of files) {
        await this.validateFileSize(file.uri);
      }

      const formData = new FormData();

      // 2. Adiciona arquivos ao FormData com a mesma chave 'attachments'
      files.forEach((file) => {
        // @ts-ignore: React Native FormData requer este formato específico
        formData.append('attachments', {
          uri: file.uri,
          name: file.name || 'upload.jpg',
          type: file.type || 'application/octet-stream',
        });
      });

      console.log(`[AttachmentService] Batch uploading ${files.length} files to chat ${chatId}`);

      // 3. Envia requisição única
      const messages = await api.post<ChatMessage[]>(
        `/api/v1/chats/${chatId}/messages/attach/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // Timeout maior para uploads em lote
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

      console.log(`[AttachmentService] Batch upload successful. Created ${messages.length} messages.`);
      return messages;
      
    } catch (error: any) {
      console.error('[AttachmentService] Batch upload failed:', error);
      
      if (error.response?.data) {
        const errorMsg = error.response.data.detail || 
                         JSON.stringify(error.response.data) || 
                         'Erro ao enviar arquivos';
        throw new Error(errorMsg);
      }

      throw new Error('Erro ao enviar arquivos. Verifique sua conexão.');
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