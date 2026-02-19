import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '@/types'

interface AuthState {
  token: string | null
  usuario: Usuario | null
  isAuthenticated: boolean
  login: (token: string, usuario: Usuario) => void
  logout: () => void
  setUsuario: (usuario: Usuario) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,

      login: (token, usuario) => {
        localStorage.setItem('access_token', token)
        set({ token, usuario, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('usuario')
        set({ token: null, usuario: null, isAuthenticated: false })
      },

      setUsuario: (usuario) => set({ usuario }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        usuario: state.usuario,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
