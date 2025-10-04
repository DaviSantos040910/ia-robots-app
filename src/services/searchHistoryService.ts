// src/services/searchHistoryService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_STORAGE_KEY = '@SearchHistory';
const MAX_HISTORY_ITEMS = 3;
// This flag allows us to show mock data during development without affecting production logic.
const USE_MOCK_HISTORY = true;

export type SearchHistoryItem = {
  id: string;
  term: string;
};

// Mock data to be returned when USE_MOCK_HISTORY is true.
const mockHistory: SearchHistoryItem[] = [
  { id: '1', term: 'Goodnight stories' },
  { id: '2', term: "Summary of this month's work" },
  { id: '3', term: 'Healthy Eating Pairing' },
];

const searchHistoryService = {
  async getHistory(): Promise<SearchHistoryItem[]> {
    if (USE_MOCK_HISTORY) {
      return mockHistory;
    }
    try {
      const jsonValue = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to fetch search history.', e);
      return [];
    }
  },

  async addSearchTerm(term: string): Promise<SearchHistoryItem[]> {
    if (!term.trim()) return await this.getHistory();
    if (USE_MOCK_HISTORY) {
        console.log(`[MOCK] Would add term: ${term}`);
        // Here you could manipulate the mockHistory array if needed for testing.
        return mockHistory;
    }
    try {
      const currentHistory = await this.getHistory();
      const filteredHistory = currentHistory.filter(item => item.term.toLowerCase() !== term.toLowerCase());
      const newHistory = [{ id: Date.now().toString(), term }, ...filteredHistory];
      const limitedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
      const jsonValue = JSON.stringify(limitedHistory);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, jsonValue);
      return limitedHistory;
    } catch (e) {
      console.error('Failed to save search term.', e);
      return await this.getHistory();
    }
  },

  async removeSearchTerm(id: string): Promise<SearchHistoryItem[]> {
    // ... (implementation unchanged)
    return [];
  },

  async clearHistory(): Promise<void> {
    // ... (implementation unchanged)
  },
};

export default searchHistoryService;