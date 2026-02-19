import { api } from './client'
import type { Projeto, ProjetoCreate, ProjetoUpdate, ProjetoFiltros } from '@/types'

export const projetosApi = {
  listar: async (params?: ProjetoFiltros): Promise<Projeto[]> => {
    const { data } = await api.get<Projeto[]>('/projetos/', { params })
    return data
  },

  obter: async (id: number): Promise<Projeto> => {
    const { data } = await api.get<Projeto>(`/projetos/${id}`)
    return data
  },

  criar: async (payload: ProjetoCreate): Promise<Projeto> => {
    const { data } = await api.post<Projeto>('/projetos/', payload)
    return data
  },

  atualizar: async (id: number, payload: ProjetoUpdate): Promise<Projeto> => {
    const { data } = await api.put<Projeto>(`/projetos/${id}`, payload)
    return data
  },

  desativar: async (id: number): Promise<Projeto> => {
    const { data } = await api.patch<Projeto>(`/projetos/${id}/desativar`)
    return data
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/projetos/${id}`)
  },
}
