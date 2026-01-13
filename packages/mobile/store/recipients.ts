import { create } from 'zustand';
import { api } from '../lib/api';
import { getLocalRecipients, saveLocalRecipients, addLocalRecipient, deleteLocalRecipient } from '../lib/db';

export interface Recipient {
  id: string;
  name: string;
  email: string;
  relationship?: string;
}

interface RecipientsState {
  recipients: Recipient[];
  isLoading: boolean;
  fetchRecipients: () => Promise<void>;
  addRecipient: (recipient: { name: string; email: string; relationship?: string }) => Promise<void>;
  deleteRecipient: (id: string) => Promise<void>;
  loadFromCache: () => void;
}

export const useRecipientsStore = create<RecipientsState>((set, get) => ({
  recipients: [],
  isLoading: false,

  loadFromCache: () => {
    try {
      const cached = getLocalRecipients();
      set({ recipients: cached });
    } catch (e) {
      console.error('Failed to load recipients from cache', e);
    }
  },

  fetchRecipients: async () => {
    set({ isLoading: true });
    try {
      // 1. Fetch from API
      const data = await api.recipients.list();

      // 2. Update local DB
      saveLocalRecipients(data);

      // 3. Update store
      set({ recipients: data, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch recipients', e);
      set({ isLoading: false });
    }
  },

  addRecipient: async (recipient) => {
    set({ isLoading: true });
    try {
      // API Call
      const result = await api.recipients.create(recipient);

      // Optimistic or result-based update could happen here.
      // api.create returns { id }, so we construct the full object
      const newRecipient: Recipient = {
        id: result.id,
        ...recipient,
      };

      // Add to local DB
      addLocalRecipient(newRecipient);

      // Refresh full list from server to be safe (or just append to state)
      // For now, let's append to state to be snappy
      set((state) => ({
        recipients: [newRecipient, ...state.recipients],
        isLoading: false,
      }));

      // Background Store refresh
      get().fetchRecipients();
    } catch (e) {
      console.error('Failed to add recipient', e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteRecipient: async (id) => {
    set({ isLoading: true });
    try {
      await api.recipients.delete(id);

      // Update local DB
      deleteLocalRecipient(id);

      set((state) => ({
        recipients: state.recipients.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (e) {
      console.error('Failed to delete recipient', e);
      set({ isLoading: false });
      throw e;
    }
  },
}));
