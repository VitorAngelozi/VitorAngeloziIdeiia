import { api } from './client'
import type { Contrato, ContratoCreate, ContratoUpdate, ContratoFiltros } from '@/types'

export const contratosApi = {
  listar: async (params?: ContratoFiltros): Promise<Contrato[]> => {
    const { data } = await api.get<Contrato[]>('/contratos/', { params })
    return data
  },

  obter: async (id: number): Promise<Contrato> => {
    const { data } = await api.get<Contrato>(`/contratos/${id}`)
    return data
  },

  criar: async (payload: ContratoCreate): Promise<Contrato> => {
    const { data } = await api.post<Contrato>('/contratos/', payload)
    return data
  },

  atualizar: async (id: number, payload: ContratoUpdate): Promise<Contrato> => {
    const { data } = await api.put<Contrato>(`/contratos/${id}`, payload)
    return data
  },

  desativar: async (id: number): Promise<Contrato> => {
    const { data } = await api.patch<Contrato>(`/contratos/${id}/desativar`)
    return data
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/contratos/${id}`)
  },
}
