import { create } from 'zustand'

interface UIState {
  isCartOpen: boolean
  isMenuOpen: boolean
  toggleCart: () => void
  toggleMenu: () => void
  closeCart: () => void
  closeMenu: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isCartOpen: false,
  isMenuOpen: false,
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  closeCart: () => set({ isCartOpen: false }),
  closeMenu: () => set({ isMenuOpen: false }),
}))