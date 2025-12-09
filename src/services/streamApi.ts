// services/streamApi.ts
/**
 * Serviço de streaming SSE para chat.
 * Gerencia conexão Server-Sent Events com o backend.
 */

import EventSource, { EventSourceListener } from "react-native-sse";
import * as SecureStore from 'expo-secure-store';
import config from '../config';

const env = config();

/** Metadados recebidos nos eventos SSE */
export interface StreamMetadata {
    message_id?: string;
    type?: 'start' | 'chunk' | 'end' | 'error';
    text?: string;
    detail?: string;
    clean_content?: string;
    suggestions?: string[];
}

/** Callbacks para eventos do stream */
interface StreamCallbacks {
    onChunk: (text: string) => void;
    onFinish: (metadata: StreamMetadata) => void;
    onError: (error: Error) => void;
}

/**
 * Inicia conexão SSE para streaming de mensagem.
 * 
 * @param chatId - ID do chat
 * @param content - Conteúdo da mensagem do usuário
 * @param callbacks - Handlers para eventos do stream
 * @returns Função de cleanup para cancelar a conexão
 */
export const streamMessage = async (
    chatId: string,
    content: string,
    callbacks: StreamCallbacks
): Promise<(() => void) | undefined> => {
    // Obter token de autenticação
    let token: string | null = null;
    try {
        token = await SecureStore.getItemAsync('authToken');
    } catch (e) {
        callbacks.onError(new Error('Falha de autenticação'));
        return undefined;
    }

    if (!token) {
        callbacks.onError(new Error('Token não encontrado'));
        return undefined;
    }

    const url = `${env.api.baseUrl}/api/v1/chats/${chatId}/stream/`;
    
    // Criar conexão EventSource
    const es = new EventSource<"message" | "error" | "open">(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ content }),
        pollingInterval: 0,
    });

    // Handler unificado de eventos
    const listener: EventSourceListener<"message" | "error" | "open"> = (event) => {
        switch (event.type) {
            case 'open':
                // Conexão estabelecida
                break;

            case 'message':
                try {
                    const data = JSON.parse(event.data || '{}') as StreamMetadata;
                    
                    switch (data.type) {
                        case 'start':
                            // Stream iniciado, aguardando chunks
                            break;
                        case 'chunk':
                            if (data.text) {
                                callbacks.onChunk(data.text);
                            }
                            break;
                        case 'end':
                            es.close();
                            callbacks.onFinish(data);
                            break;
                        case 'error':
                            es.close();
                            callbacks.onError(new Error(data.detail || 'Stream error'));
                            break;
                    }
                } catch (err) {
                    console.warn('[StreamApi] Parse error:', err);
                }
                break;

            case 'error':
                es.close();
                callbacks.onError(new Error('Connection lost'));
                break;
        }
    };

    // Registrar listeners
    es.addEventListener('open', listener);
    es.addEventListener('message', listener);
    es.addEventListener('error', listener);

    // Retornar função de cleanup
    return () => {
        es.removeAllEventListeners();
        es.close();
    };
};
