
import { ChatMessage } from '../types/chat';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const chatService = {
  /**
   * Envia uma mensagem do usuário e retorna a resposta do bot.
   * 
TODO: substituir mock por chamada real ao backend e popular 'suggestions' com as sugestões retornadas.
   */
  async sendMessage(chatId: string, content: string): Promise<ChatMessage> {
    await delay(350);

    // Mock de sugestões (o backend deve retornar isso já pronto)
    const suggestions = content.trim().length > 18
      ? ['Explique melhor.', 'Quero exemplos.']
      : ['Me conte mais.', 'E depois?'];

    return {
      id: String(Date.now()),
      role: 'assistant',
      content: `Você disse: ${content}`,
      suggestions,
    };
  },

  /**
   * Solicita ao backend que reescreva a resposta de uma mensagem específica.
   * Deve devolver o novo texto que substituirá o conteúdo no MESMO card.
   */
  async rewriteMessage(chatId: string, messageId: string, content: string): Promise<string> {
    await delay(500);
    return `Reescrevi: ${content}`; // <- Substitua por chamada real ao backend
  },

  /**
   * Solicita a síntese de fala (TTS) ao backend para a mensagem informada.
   * Deve devolver a URL do áudio para ser tocada pelo app.
   */
  async synthesizeSpeech(chatId: string, messageId: string, content: string): Promise<string> {
    await delay(300);
    return 'https://example.com/audio.mp3'; // <- Substitua por TTS real do backend
  },
};
