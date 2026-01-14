import { create } from 'zustand';

interface NexusState {
  user: any | null;
  agents: any[];
  notifications: any[];
  sidebarOpen: boolean;
  activeAgent: string | null;
  setUser: (user: any) => void;
  setAgents: (agents: any[]) => void;
  setNotifications: (notifications: any[]) => void;
  toggleSidebar: () => void;
  setActiveAgent: (agentId: string | null) => void;
}

export const useNexusStore = create<NexusState>((set) => ({
  user: null,
  agents: [],
  notifications: [],
  sidebarOpen: true,
  activeAgent: null,
  setUser: (user) => set({ user }),
  setAgents: (agents) => set({ agents }),
  setNotifications: (notifications) => set({ notifications }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveAgent: (agentId) => set({ activeAgent: agentId })
}));
