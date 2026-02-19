import { useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  FileText,
  FolderOpen,
  Calculator,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Plus,
} from 'lucide-react'

import { clientesApi } from '@/api/clients'
import { contratosApi } from '@/api/contracts'
import { projetosApi } from '@/api/projects'
import { orcamentosApi } from '@/api/orders'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card'
import { Badge, statusOrcamentoBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table'
import { formatCurrency, formatDate, parseNumber } from '@/lib/utils'
import type { Orcamento } from '@/types'

export function Dashboard() {
  const navigate = useNavigate()

  const [clientesQuery, contratosQuery, projetosQuery, orcamentosQuery] = useQueries({
    queries: [
      {
        queryKey: ['clientes'],
        queryFn: () => clientesApi.listar({ limit: 100 }),
        staleTime: 30_000,
      },
      {
        queryKey: ['contratos'],
        queryFn: () => contratosApi.listar({ limit: 100 }),
        staleTime: 30_000,
      },
      {
        queryKey: ['projetos'],
        queryFn: () => projetosApi.listar({ limit: 100 }),
        staleTime: 30_000,
      },
      {
        queryKey: ['orcamentos'],
        queryFn: () => orcamentosApi.listar({ limit: 100 }),
        staleTime: 30_000,
      },
    ],
  })

  const isLoading =
    clientesQuery.isLoading ||
    contratosQuery.isLoading ||
    projetosQuery.isLoading ||
    orcamentosQuery.isLoading

  const clientes = clientesQuery.data ?? []
  const contratos = contratosQuery.data ?? []
  const projetos = projetosQuery.data ?? []
  const orcamentos = orcamentosQuery.data ?? []

  const contratosAtivos = contratos.filter((c) => c.status === 'ativo').length
  const projetosAtivos = projetos.filter((p) => p.status === 'ativo').length
  const orcamentosRascunho = orcamentos.filter((o) => o.status === 'Rascunho').length
  const orcamentosAprovados = orcamentos.filter((o) => o.status === 'Aprovado').length

  const valorTotalAprovados = orcamentos
    .filter((o) => o.status === 'Aprovado')
    .reduce((acc, o) => acc + parseNumber(o.valor_total_liquido), 0)

  // Last 5 orders sorted by id desc
  const recentOrders: Orcamento[] = [...orcamentos]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de orçamentos"
        actions={
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/orcamentos/novo')}
          >
            Novo Orçamento
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* ── Stats row ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Clientes"
              value={clientes.length}
              description="Cadastrados no sistema"
              icon={<Users />}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Contratos Ativos"
              value={contratosAtivos}
              description={`de ${contratos.length} contratos total`}
              icon={<FileText />}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <StatCard
              title="Projetos Ativos"
              value={projetosAtivos}
              description={`de ${projetos.length} projetos total`}
              icon={<FolderOpen />}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              title="Orçamentos"
              value={orcamentos.length}
              description={`${orcamentosAprovados} aprovados · ${orcamentosRascunho} rascunhos`}
              icon={<Calculator />}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
          </div>

          {/* ── Second stats row ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Valor Total Aprovado"
              value={formatCurrency(valorTotalAprovados)}
              description="Soma dos orçamentos aprovados"
              icon={<TrendingUp />}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <StatCard
              title="Em Rascunho"
              value={orcamentosRascunho}
              description="Aguardando aprovação"
              icon={<Clock />}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              title="Aprovados"
              value={orcamentosAprovados}
              description="Orçamentos finalizados"
              icon={<CheckCircle />}
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
          </div>

          {/* ── Recent orders ───────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos Recentes</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/orcamentos')}
              >
                Ver todos
              </Button>
            </CardHeader>
            <CardBody padding="none">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Número</TableHeaderCell>
                    <TableHeaderCell>Emissão</TableHeaderCell>
                    <TableHeaderCell>Versão</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell align="right">Valor Bruto</TableHeaderCell>
                    <TableHeaderCell align="right">Desconto</TableHeaderCell>
                    <TableHeaderCell align="right">Valor Líquido</TableHeaderCell>
                    <TableHeaderCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.length === 0 ? (
                    <TableEmpty
                      colSpan={8}
                      message="Nenhum orçamento encontrado."
                      icon={<Calculator className="w-10 h-10" />}
                    />
                  ) : (
                    recentOrders.map((orc) => (
                      <TableRow
                        key={orc.id}
                        clickable
                        onClick={() => navigate(`/orcamentos/${orc.id}`)}
                      >
                        <TableCell>
                          <span className="font-medium text-slate-800">
                            {orc.numero_orcamento}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(orc.data_emissao)}</TableCell>
                        <TableCell>
                          <span className="text-slate-500">v{orc.versao}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusOrcamentoBadge(orc.status)}
                            dot
                          >
                            {orc.status}
                          </Badge>
                        </TableCell>
                        <TableCell align="right" className="text-slate-600">
                          {formatCurrency(orc.valor_total_bruto)}
                        </TableCell>
                        <TableCell align="right" className="text-slate-500">
                          {parseNumber(orc.desconto_percentual).toFixed(2)}%
                        </TableCell>
                        <TableCell align="right">
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(orc.valor_total_liquido)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          {/* ── Quick actions ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Novo Cliente',
                desc: 'Cadastrar cliente',
                to: '/clientes',
                icon: <Users className="w-5 h-5" />,
                color: 'text-blue-600',
                bg: 'bg-blue-50 hover:bg-blue-100',
              },
              {
                label: 'Novo Contrato',
                desc: 'Criar contrato',
                to: '/contratos',
                icon: <FileText className="w-5 h-5" />,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50 hover:bg-emerald-100',
              },
              {
                label: 'Novo Projeto',
                desc: 'Cadastrar projeto',
                to: '/projetos',
                icon: <FolderOpen className="w-5 h-5" />,
                color: 'text-amber-600',
                bg: 'bg-amber-50 hover:bg-amber-100',
              },
              {
                label: 'Novo Orçamento',
                desc: 'Criar orçamento',
                to: '/orcamentos/novo',
                icon: <Calculator className="w-5 h-5" />,
                color: 'text-purple-600',
                bg: 'bg-purple-50 hover:bg-purple-100',
              },
            ].map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-card-hover transition-all duration-200 text-left group ${item.bg}`}
              >
                <div className={`shrink-0 ${item.color}`}>{item.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
