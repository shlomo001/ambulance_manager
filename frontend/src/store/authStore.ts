import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthState } from '../types'
import { authApi } from '../utils/api'

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (user: User) => void
  setLoading: (loading: boolean) => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(email, password)
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            throw new Error(response.error || 'התחברות נכשלה')
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        const { refreshToken } = get()
        if (refreshToken) {
          authApi.logout(refreshToken).catch(console.error)
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      refreshToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) {
          throw new Error('אין טוקן רענון')
        }

        try {
          const response = await authApi.refreshToken(refreshToken)
          if (response.success && response.data) {
            const { user, accessToken } = response.data
            set({
              user,
              accessToken,
              isAuthenticated: true,
            })
          } else {
            throw new Error('רענון טוקן נכשל')
          }
        } catch (error) {
          get().logout()
          throw error
        }
      },

      updateUser: (user: User) => {
        set({ user })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      checkAuth: async () => {
        set({ isLoading: true })
        try {
          const response = await authApi.checkAuth()
          if (response.success && response.data) {
            const { user } = response.data
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error) {
          set({
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
