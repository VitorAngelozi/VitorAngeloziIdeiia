import { api } from './client'
import type {
  Orcamento,
  OrcamentoCreate,
  OrcamentoFiltros,
  ItemOrcamentoCreate,
  AtualizarHorasItem,
  AtualizarDescontoOrcamento,
  HistoricoAuditoria,
} from '@/types'

export const orcamentosApi = {
  listar: async (params?: OrcamentoFiltros): Promise<Orcamento[]> => {
    const { data } = await api.get<Orcamento[]>('/orcamentos/', { params })
    return data
  },

  obter: async (id: number): Promise<Orcamento> => {
    const { data } = await api.get<Orcamento>(`/orcamentos/${id}`)
    return data
  },

  criar: async (payload: OrcamentoCreate): Promise<Orcamento> => {
    const { data } = await api.post<Orcamento>('/orcamentos/', payload)
    return data
  },

  atualizar: async (id: number, payload: OrcamentoCreate): Promise<Orcamento> => {
    const { data } = await api.put<Orcamento>(`/orcamentos/${id}`, payload)
    return data
  },

  aprovar: async (id: number): Promise<Orcamento> => {
    const { data } = await api.patch<Orcamento>(`/orcamentos/${id}/aprovar`)
    return data
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/orcamentos/${id}`)
  },

  // ── Itens ──────────────────────────────────────────────────────────────────
  adicionarItem: async (
    orcamentoId: number,
    payload: ItemOrcamentoCreate
  ): Promise<Orcamento> => {
    const { data } = await api.post<Orcamento>(
      `/orcamentos/${orcamentoId}/itens`,
      payload
    )
    return data
  },

  removerItem: async (orcamentoId: number, itemId: number): Promise<Orcamento> => {
    const { data } = await api.delete<Orcamento>(
      `/orcamentos/${orcamentoId}/itens/${itemId}`
    )
    return data
  },

  atualizarHorasItem: async (
    orcamentoId: number,
    itemId: number,
    payload: AtualizarHorasItem
  ): Promise<Orcamento> => {
    const { data } = await api.patch<Orcamento>(
      `/orcamentos/${orcamentoId}/itens/${itemId}`,
      payload
    )
    return data
  },

  // ── Desconto ───────────────────────────────────────────────────────────────
  atualizarDesconto: async (
    orcamentoId: number,
    payload: AtualizarDescontoOrcamento
  ): Promise<Orcamento> => {
    const { data } = await api.patch<Orcamento>(
      `/orcamentos/${orcamentoId}/desconto`,
      payload
    )
    return data
  },

  // ── Auditoria ──────────────────────────────────────────────────────────────
  auditoria: async (orcamentoId: number): Promise<HistoricoAuditoria[]> => {
    const { data } = await api.get<HistoricoAuditoria[]>(
      `/auditoria/orcamentos/${orcamentoId}`
    )
    return data
  },

  auditoriaItem: async (itemId: number): Promise<HistoricoAuditoria[]> => {
    const { data } = await api.get<HistoricoAuditoria[]>(
      `/auditoria/itens/${itemId}`
    )
    return data
  },
}
