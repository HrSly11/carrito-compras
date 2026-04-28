import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  nombre: string
  apellido: string
  telefono?: string
  roles: string[]
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setAuth: (user: User, accessToken: string) => void
  updateUser: (user: User) => void
  logout: () => void
  setAccessToken: (token: string) => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true })
      },
      updateUser: (user) => {
        set({ user })
      },
      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false })
      },
      setAccessToken: (token) => {
        set({ accessToken: token })
      },
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)