import { api } from './client'
import type { Catalogo, CatalogoCreate, CatalogoUpdate, PaginationParams } from '@/types'

export const catalogoApi = {
  listar: async (params?: PaginationParams & { tipo?: string }): Promise<Catalogo[]> => {
    const { data } = await api.get<Catalogo[]>('/catalogo/', { params })
    return data
  },

  listarPorTipo: async (tipo: string): Promise<Catalogo[]> => {
    const { data } = await api.get<Catalogo[]>('/catalogo/', { params: { tipo, limit: 100 } })
    return data
  },

  obter: async (id: number): Promise<Catalogo> => {
    const { data } = await api.get<Catalogo>(`/catalogo/${id}`)
    return data
  },

  criar: async (payload: CatalogoCreate): Promise<Catalogo> => {
    console.log('[CATALOGO API] Enviando payload:', JSON.stringify(payload, null, 2))
    try {
      const { data } = await api.post<Catalogo>('/catalogo/', payload)
      console.log('[CATALOGO API] Resposta recebida:', data)
      return data
    } catch (error) {
      console.error('[CATALOGO API] Erro ao criar:', error)
      throw error
    }
  },

  atualizar: async (id: number, payload: CatalogoUpdate): Promise<Catalogo> => {
    const { data } = await api.put<Catalogo>(`/catalogo/${id}`, payload)
    return data
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/catalogo/${id}`)
  },
}
