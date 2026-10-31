import { create } from 'zustand';

export type AppMode = 'buy' | 'sell';

interface ModeState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

export const useModeStore = create<ModeState>((set) => ({
  mode: 'buy',
  setMode: (mode: AppMode) => set({ mode }),
  toggleMode: () =>
    set((state) => ({ mode: state.mode === 'buy' ? 'sell' : 'buy' })),
}));
