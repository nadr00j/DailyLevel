import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabView } from '@/types';

interface TabState {
  activeTab: TabView;
  setActiveTab: (tab: TabView) => void;
}

export const useTabStore = create<TabState>()(
  persist(
    (set) => ({
      activeTab: 'today',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'dl.tabs.v1',
      partialize: (state) => ({
        activeTab: state.activeTab,
      }),
    }
  )
);
