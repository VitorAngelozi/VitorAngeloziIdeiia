import { api } from './client'
import type { LoginCredentials, LoginResponse, Usuario } from '@/types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials)
    return data
  },

  me: async (): Promise<Usuario> => {
    const { data } = await api.get<Usuario>('/auth/me')
    return data
  },

  registro: async (payload: {
    username: string
    password: string
    email?: string
  }): Promise<Usuario> => {
    const { data } = await api.post<Usuario>('/auth/registro', payload)
    return data
  },

  listarUsuarios: async (): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>('/auth/usuarios')
    return data
  },

  deletarUsuario: async (id: number): Promise<void> => {
    await api.delete(`/auth/usuarios/${id}`)
  },

  promoverAdmin: async (id: number): Promise<Usuario> => {
    const { data } = await api.post<Usuario>(`/auth/usuarios/${id}/promote`)
    return data
  },

  removerAdmin: async (id: number): Promise<Usuario> => {
    const { data } = await api.post<Usuario>(`/auth/usuarios/${id}/demote`)
    return data
  },
}
