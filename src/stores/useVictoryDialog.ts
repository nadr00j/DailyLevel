import { create } from 'zustand';

interface VictoryState {
  open: boolean;
  title: string;
  points: number;
  icon?: string;
  show: (title: string, points?: number, icon?:string) => void;
  close: () => void;
}

export const useVictoryDialog = create<VictoryState>((set) => ({
  open: false,
  title: '',
  points: 100,
  icon: undefined,
  show: (title, points = 100, icon) => set({ open: true, title, points, icon }),
  close: () => set({ open: false }),
}));
