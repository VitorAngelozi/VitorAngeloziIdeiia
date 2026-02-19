import { api } from './client'
import type { Cliente, ClienteCreate, PaginationParams } from '@/types'

export const clientesApi = {
  listar: async (params?: PaginationParams): Promise<Cliente[]> => {
    const { data } = await api.get<Cliente[]>('/clientes/', { params })
    return data
  },

  obter: async (id: number): Promise<Cliente> => {
    const { data } = await api.get<Cliente>(`/clientes/${id}`)
    return data
  },

  criar: async (payload: ClienteCreate): Promise<Cliente> => {
    const { data } = await api.post<Cliente>('/clientes/', payload)
    return data
  },

  atualizar: async (id: number, payload: ClienteCreate): Promise<Cliente> => {
    const { data } = await api.put<Cliente>(`/clientes/${id}`, payload)
    return data
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`)
  },
}
