// src/services/searchHistoryService.ts
import api from './api';

export type SearchHistoryItem = {
  id: string;
  term: string;
};

// This is the real service that interacts with your Django backend API.
const realSearchHistoryService = {
  /**
   * Fetches the user's search history from the server.
   * @returns A promise that resolves with an array of search history items.
   */
  async getHistory(): Promise<SearchHistoryItem[]> {
    try {
      const history = await api.get<SearchHistoryItem[]>('/api/v1/explore/history/');
      return history;
    } catch (e) {
      console.error('Failed to fetch search history.', e);
      return [];
    }
  },

  /**
   * Adds a new search term to the user's history on the server.
   * @param term - The search term to add.
   * @returns A promise that resolves with the updated list of search history items.
   */
  async addSearchTerm(term: string): Promise<SearchHistoryItem[]> {
    if (!term.trim()) return await this.getHistory();
    try {
      // The backend will handle creating a new entry or updating the timestamp of an existing one.
      await api.post('/api/v1/explore/history/', { term });
      return await this.getHistory();
    } catch (e) {
      console.error('Failed to save search term.', e);
      // Return the existing history on failure
      return await this.getHistory();
    }
  },

  /**
   * Removes a specific search term from the user's history on the server.
   * @param id - The ID of the history item to remove.
   * @returns A promise that resolves with the updated list of search history items.
   */
  async removeSearchTerm(id: string): Promise<SearchHistoryItem[]> {
    try {
        await api.delete(`/api/v1/explore/history/${id}/`);
        return await this.getHistory();
    } catch(e) {
        console.error('Failed to remove search term', e);
        return await this.getHistory();
    }
  },

  /**
   * Clears the entire search history for the user on the server.
   */
  async clearHistory(): Promise<void> {
    try {
        await api.delete('/api/v1/explore/history/');
    } catch(e) {
        console.error('Failed to clear history', e);
    }
  },
};

// --- Mock Service (Kept for testing purposes if needed) ---
const mockHistory: SearchHistoryItem[] = [
    { id: '1', term: 'Goodnight stories' },
    { id: '2', term: "Summary of this month's work" },
    { id: '3', term: 'Healthy Eating Pairing' },
];

const mockSearchHistoryService = {
    getHistory: async () => mockHistory,
    addSearchTerm: async (term: string) => { console.log(`[MOCK] Add: ${term}`); return mockHistory; },
    removeSearchTerm: async (id: string) => { console.log(`[MOCK] Remove: ${id}`); return mockHistory; },
    clearHistory: async () => { console.log(`[MOCK] Clear all`); },
};

// This flag allows you to easily switch between the real API and mock data during development.
// It should be set to `false` for the application to work with the backend.
const USE_MOCK_API = false;

const searchHistoryService = USE_MOCK_API ? mockSearchHistoryService : realSearchHistoryService;

export default searchHistoryService;