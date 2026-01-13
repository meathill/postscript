import { create } from 'zustand';

interface HeartbeatStatus {
  lastHeartbeat: number | null;
  nextHeartbeatDue: number | null;
  isOverdue: boolean;
  gracePeriodEnd: number | null;
}

interface HeartbeatState {
  status: HeartbeatStatus;
  isLoading: boolean;
  fetchStatus: () => Promise<void>;
  checkIn: () => Promise<void>;
}

// Mock data for now until API is ready/connected
export const useHeartbeatStore = create<HeartbeatState>((set) => ({
  status: {
    lastHeartbeat: Date.now(),
    nextHeartbeatDue: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days later
    isOverdue: false,
    gracePeriodEnd: null,
  },
  isLoading: false,

  fetchStatus: async () => {
    set({ isLoading: true });
    try {
      // TODO: Call API
      // const data = await api.heartbeat.getStatus();
      // set({ status: data });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ isLoading: false });
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  checkIn: async () => {
    set({ isLoading: true });
    try {
      // TODO: Call API
      // await api.heartbeat.checkIn();

      // Update local state optimistically
      set((state) => ({
        status: {
          ...state.status,
          lastHeartbeat: Date.now(),
          nextHeartbeatDue: Date.now() + 7 * 24 * 60 * 60 * 1000,
          isOverdue: false,
        },
        isLoading: false,
      }));
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },
}));
