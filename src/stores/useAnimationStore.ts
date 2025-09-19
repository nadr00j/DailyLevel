import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnimationState {
  pixelBuddyAnimationCount: number;
  incrementPixelBuddyAnimation: () => void;
  resetAnimations: () => void;
}

export const useAnimationStore = create<AnimationState>()(
  persist(
    (set) => ({
      pixelBuddyAnimationCount: 0,
      incrementPixelBuddyAnimation: () => set((state) => ({ 
        pixelBuddyAnimationCount: state.pixelBuddyAnimationCount + 1 
      })),
      resetAnimations: () => set({ pixelBuddyAnimationCount: 0 })
    }),
    { name: 'dl.animations.v1' }
  )
);
