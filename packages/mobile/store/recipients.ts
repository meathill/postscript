import { create } from 'zustand';
import { api } from '../lib/api';

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
}

export const useRecipientsStore = create<RecipientsState>((set, get) => ({
  recipients: [],
  isLoading: false,

  fetchRecipients: async () => {
    set({ isLoading: true });
    try {
      const data = await api.recipients.list();
      set({ recipients: data, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch recipients', e);
      set({ isLoading: false });
    }
  },

  addRecipient: async (recipient) => {
    set({ isLoading: true });
    try {
      await api.recipients.create(recipient);
      await get().fetchRecipients();
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
