import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Calculator, Search, Plus, ArrowRight, Eye } from "lucide-react";

import { orcamentosApi } from "@/api/orders";
import { contratosApi } from "@/api/contracts";
import { projetosApi } from "@/api/projects";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, statusOrcamentoBadge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
} from "@/components/ui/Table";
import { LoadingOverlay } from "@/components/ui/Spinner";
import { formatCurrency, formatDate, parseNumber } from "@/lib/utils";

export function OrdersPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterContrato, setFilterContrato] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: () => orcamentosApi.listar({ limit: 100 }),
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ["contratos"],
    queryFn: () => contratosApi.listar({ limit: 100 }),
  });

  const { data: projetos = [] } = useQuery({
    queryKey: ["projetos"],
    queryFn: () => projetosApi.listar({ limit: 100 }),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const contratoMap = Object.fromEntries(
    contratos.map((c) => [c.id, c.numero_contrato]),
  );
  const projetoMap = Object.fromEntries(projetos.map((p) => [p.id, p.nome]));

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = orcamentos.filter((o) => {
    const matchSearch = o.numero_orcamento
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    const matchContrato = filterContrato
      ? String(o.contrato_id) === filterContrato
      : true;
    return matchSearch && matchStatus && matchContrato;
  });

  const totalLiquido = filtered.reduce(
    (acc, o) => acc + parseNumber(o.valor_total_liquido),
    0,
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Orçamentos"
        description="Gerencie e acompanhe todos os orçamentos do sistema"
        actions={
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate("/orcamentos/novo")}
          >
            Novo Orçamento
          </Button>
        }
      />

      {/* Summary strip */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Exibindo
            </span>
            <span className="text-sm font-bold text-slate-800">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Líquido (filtrado)
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {formatCurrency(totalLiquido)}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
              Rascunhos
            </span>
            <span className="text-sm font-bold text-amber-700">
              {filtered.filter((o) => o.status === "Rascunho").length}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Aprovados
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {filtered.filter((o) => o.status === "Aprovado").length}
            </span>
          </div>
        </div>
      )}

      <Card>
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Input
              placeholder="Buscar por número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <select
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="Rascunho">Rascunho</option>
            <option value="Aprovado">Aprovado</option>
          </select>

          <select
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={filterContrato}
            onChange={(e) => setFilterContrato(e.target.value)}
          >
            <option value="">Todos os contratos</option>
            {contratos.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.numero_contrato}
              </option>
            ))}
          </select>

          {(search || filterStatus || filterContrato) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilterStatus("");
                setFilterContrato("");
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        <CardBody padding="none">
          {isLoading ? (
            <LoadingOverlay />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>#</TableHeaderCell>
                  <TableHeaderCell>Número</TableHeaderCell>
                  <TableHeaderCell>Projeto</TableHeaderCell>
                  <TableHeaderCell>Contrato</TableHeaderCell>
                  <TableHeaderCell>Emissão</TableHeaderCell>
                  <TableHeaderCell>Versão</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell align="right">Valor Bruto</TableHeaderCell>
                  <TableHeaderCell align="right">Desconto</TableHeaderCell>
                  <TableHeaderCell align="right">Valor Líquido</TableHeaderCell>
                  <TableHeaderCell align="center">Itens</TableHeaderCell>
                  <TableHeaderCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableEmpty
                    colSpan={12}
                    message={
                      search || filterStatus || filterContrato
                        ? "Nenhum orçamento corresponde aos filtros."
                        : "Nenhum orçamento cadastrado."
                    }
                    icon={<Calculator className="w-10 h-10" />}
                  />
                ) : (
                  filtered.map((orc) => (
                    <TableRow
                      key={orc.id}
                      clickable
                      onClick={() => navigate(`/orcamentos/${orc.id}`)}
                    >
                      <TableCell className="text-slate-400 w-10">
                        {orc.id}
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {orc.numero_orcamento}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-slate-600 max-w-[160px] truncate block">
                          {projetoMap[orc.projeto_id] ??
                            `Projeto #${orc.projeto_id}`}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-slate-500 text-xs">
                          {contratoMap[orc.contrato_id] ??
                            `Contrato #${orc.contrato_id}`}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-slate-500 text-xs">
                          {formatDate(orc.data_emissao)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-slate-400 text-xs">
                          v{orc.versao}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusOrcamentoBadge(orc.status)} dot>
                          {orc.status}
                        </Badge>
                      </TableCell>

                      <TableCell
                        align="right"
                        className="text-slate-600 text-xs"
                      >
                        {formatCurrency(orc.valor_total_bruto)}
                      </TableCell>

                      <TableCell align="right">
                        <span
                          className={
                            parseNumber(orc.desconto_percentual) > 0
                              ? "text-amber-600 text-xs font-medium"
                              : "text-slate-400 text-xs"
                          }
                        >
                          {parseNumber(orc.desconto_percentual).toFixed(2)}%
                        </span>
                      </TableCell>

                      <TableCell align="right">
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(orc.valor_total_liquido)}
                        </span>
                      </TableCell>

                      <TableCell align="center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                          {orc.itens?.length ?? 0}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Eye className="w-4 h-4 text-slate-300" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
