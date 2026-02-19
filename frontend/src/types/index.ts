// ========== AUTH ==========
export interface Usuario {
  id: number
  username: string
  email: string | null
  admin: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  usuario: Usuario
}

// ========== CLIENTE ==========
export interface Cliente {
  id: number
  razao_social: string
  cnpj: string
}

export interface ClienteCreate {
  razao_social: string
  cnpj: string
}

// ========== CONTRATO ==========
export interface Contrato {
  id: number
  numero_contrato: string
  cliente_id: number
  valor_ust: number | string
  data_inicio: string | null
  data_fim: string | null
  status: string
}

export interface ContratoCreate {
  numero_contrato: string
  cliente_id: number
  valor_ust: number
  data_inicio?: string | null
  data_fim?: string | null
  status: string
}

export interface ContratoUpdate {
  numero_contrato?: string
  valor_ust?: number
  status?: string
}

// ========== PROJETO ==========
export interface Projeto {
  id: number
  nome: string
  codigo: string
  cliente_id: number
  contrato_id: number | null
  status: string
}

export interface ProjetoCreate {
  nome: string
  codigo: string
  cliente_id: number
  contrato_id?: number | null
  status: string
}

export interface ProjetoUpdate {
  nome?: string
  status?: string
}

// ========== CATÁLOGO ==========
export type CatalogoTipo = 'CICLO' | 'FASE' | 'ATIVIDADE'

export interface Catalogo {
  id: number
  nome: string
  tipo: CatalogoTipo
  parent_id: number | null
  complexidade_ust: number | string | null
}

export interface CatalogoCreate {
  nome: string
  tipo: CatalogoTipo
  parent_id?: number | null
  complexidade_ust?: number | null
}

export interface CatalogoUpdate {
  nome?: string
  parent_id?: number | null
  complexidade_ust?: number | null
}

// ========== ITEM ORÇAMENTO ==========
export interface ItemOrcamento {
  id: number
  atividade_id: number
  horas_estimadas: number | string
  complexidade_snapshot: number | string
  sequencia: number
  subtotal_ust: number | string
  subtotal_bruto: number | string
  observacoes: string | null
}

export interface ItemOrcamentoCreate {
  atividade_id: number
  horas_estimadas: number
  observacoes?: string | null
}

// ========== ORÇAMENTO ==========
export interface Orcamento {
  id: number
  numero_orcamento: string
  projeto_id: number
  contrato_id: number
  data_emissao: string
  status: string
  versao: string
  valor_total_bruto: number | string
  desconto_percentual: number | string
  valor_total_liquido: number | string
  observacoes: string | null
  itens: ItemOrcamento[]
}

export interface OrcamentoCreate {
  contrato_id: number
  projeto_id: number
  desconto_percentual: number
  observacoes?: string | null
  itens: ItemOrcamentoCreate[]
}

export interface AtualizarHorasItem {
  horas_estimadas: number
  motivo?: string | null
}

export interface AtualizarDescontoOrcamento {
  desconto_percentual: number
  motivo?: string | null
}

// ========== AUDITORIA ==========
export interface HistoricoAuditoria {
  id: number
  tipo_alteracao: string
  orcamento_id: number
  item_orcamento_id: number | null
  usuario_id: number | null
  valor_anterior: number | string
  valor_novo: number | string
  data_alteracao: string
  motivo: string | null
}

// ========== PAGINAÇÃO ==========
export interface PaginationParams {
  skip?: number
  limit?: number
}

// ========== FILTROS ==========
export interface OrcamentoFiltros extends PaginationParams {
  contrato_id?: number
  projeto_id?: number
  status?: string
}

export interface ContratoFiltros extends PaginationParams {
  cliente_id?: number
  status?: string
}

export interface ProjetoFiltros extends PaginationParams {
  cliente_id?: number
  contrato_id?: number
  status?: string
}

// ========== DASHBOARD ==========
export interface DashboardStats {
  totalClientes: number
  totalContratos: number
  contratosAtivos: number
  totalProjetos: number
  totalOrcamentos: number
  orcamentosRascunho: number
  orcamentosAprovados: number
  valorTotalAprovados: number
}
