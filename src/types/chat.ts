
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  liked?: boolean;
  rewriting?: boolean;
  audioUri?: string | null;
  /**
   * Sugestões de follow-up retornadas pelo backend para esta resposta do bot.
   * Quando existir, o app exibe mini chips logo abaixo do card desta mensagem.
   */
  suggestions?: string[];
};

export type ChatBootstrap = {
  conversationId: string;
  bot: { name: string; handle: string; avatarUrl?: string };
  welcome: string;
  /** Sugestões iniciais (Header da tela) exibidas antes da primeira mensagem. */
  suggestions: string[];
};
