import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Trash2,
  Pencil,
  Plus,
  Clock,
  FileText,
  Calculator,
  ChevronRight,
  History,
  Zap,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { orcamentosApi } from "@/api/orders";
import { contratosApi } from "@/api/contracts";
import { projetosApi } from "@/api/projects";
import { catalogoApi } from "@/api/catalog";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, statusOrcamentoBadge } from "@/components/ui/Badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
} from "@/components/ui/Card";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { LoadingOverlay } from "@/components/ui/Spinner";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
} from "@/components/ui/Table";
import { extractErrorMessage } from "@/api/client";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  parseNumber,
  calcularItemOrcamento,
} from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { ItemOrcamento } from "@/types";

// ── ValueRow ──────────────────────────────────────────────────────────────────
function ValueRow({
  label,
  value,
  highlight = false,
  muted = false,
  negative = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 ${highlight ? "border-t border-slate-200 mt-1" : ""}`}
    >
      <span
        className={`text-sm ${muted ? "text-slate-400" : "text-slate-600"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${
          highlight
            ? "text-lg text-emerald-700"
            : negative
              ? "text-amber-600"
              : muted
                ? "text-slate-400"
                : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const isAdmin = usuario?.admin === 1;
  const orcamentoId = Number(id);

  // Modal open states
  const [approveOpen, setApproveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [descontoOpen, setDescontoOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editHorasTarget, setEditHorasTarget] = useState<ItemOrcamento | null>(
    null,
  );
  const [deleteItemTarget, setDeleteItemTarget] =
    useState<ItemOrcamento | null>(null);
  const [showAuditoria, setShowAuditoria] = useState(false);

  // Local form state
  const [newDesconto, setNewDesconto] = useState("");
  const [descontoMotivo, setDescontoMotivo] = useState("");
  const [newAtividadeId, setNewAtividadeId] = useState("");
  const [newHoras, setNewHoras] = useState("");
  const [newItemObs, setNewItemObs] = useState("");
  const [editHoras, setEditHoras] = useState("");
  const [editMotivo, setEditMotivo] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: orcamento, isLoading } = useQuery({
    queryKey: ["orcamento", orcamentoId],
    queryFn: () => orcamentosApi.obter(orcamentoId),
    enabled: !!orcamentoId,
  });

  const { data: contrato } = useQuery({
    queryKey: ["contrato", orcamento?.contrato_id],
    queryFn: () => contratosApi.obter(orcamento!.contrato_id),
    enabled: !!orcamento?.contrato_id,
  });

  const { data: projeto } = useQuery({
    queryKey: ["projeto", orcamento?.projeto_id],
    queryFn: () => projetosApi.obter(orcamento!.projeto_id),
    enabled: !!orcamento?.projeto_id,
  });

  const { data: atividades = [] } = useQuery({
    queryKey: ["catalogo", "ATIVIDADE"],
    queryFn: () => catalogoApi.listarPorTipo("ATIVIDADE"),
  });

  const { data: auditoria = [] } = useQuery({
    queryKey: ["auditoria", orcamentoId],
    queryFn: () => orcamentosApi.auditoria(orcamentoId),
    enabled: showAuditoria,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["orcamento", orcamentoId] });
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
  };

  const approveMutation = useMutation({
    mutationFn: () => orcamentosApi.aprovar(orcamentoId),
    onSuccess: () => {
      toast.success("Orçamento aprovado!");
      setApproveOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => orcamentosApi.deletar(orcamentoId),
    onSuccess: () => {
      toast.success("Orçamento removido.");
      navigate("/orcamentos");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const descontoMutation = useMutation({
    mutationFn: () =>
      orcamentosApi.atualizarDesconto(orcamentoId, {
        desconto_percentual: parseFloat(newDesconto) || 0,
        motivo: descontoMotivo || null,
      }),
    onSuccess: () => {
      toast.success("Desconto atualizado!");
      setDescontoOpen(false);
      setNewDesconto("");
      setDescontoMotivo("");
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["auditoria", orcamentoId] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const addItemMutation = useMutation({
    mutationFn: () =>
      orcamentosApi.adicionarItem(orcamentoId, {
        atividade_id: parseInt(newAtividadeId),
        horas_estimadas: parseFloat(newHoras),
        observacoes: newItemObs || null,
      }),
    onSuccess: () => {
      toast.success("Item adicionado!");
      setAddItemOpen(false);
      setNewAtividadeId("");
      setNewHoras("");
      setNewItemObs("");
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const editHorasMutation = useMutation({
    mutationFn: () =>
      orcamentosApi.atualizarHorasItem(orcamentoId, editHorasTarget!.id, {
        horas_estimadas: parseFloat(editHoras),
        motivo: editMotivo || null,
      }),
    onSuccess: () => {
      toast.success("Horas atualizadas!");
      setEditHorasTarget(null);
      setEditHoras("");
      setEditMotivo("");
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["auditoria", orcamentoId] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteItemMutation = useMutation({
    mutationFn: () =>
      orcamentosApi.removerItem(orcamentoId, deleteItemTarget!.id),
    onSuccess: () => {
      toast.success("Item removido.");
      setDeleteItemTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  // ── Derived ──────────────────────────────────────────────────────────────
  const isRascunho = orcamento?.status === "Rascunho";
  const isAprovado = orcamento?.status === "Aprovado";
  const valorUst = parseNumber(contrato?.valor_ust);
  const atividadeMap = Object.fromEntries(atividades.map((a) => [a.id, a]));

  const previewNewItem = (() => {
    const ativ = atividades.find((a) => a.id === parseInt(newAtividadeId));
    const horas = parseFloat(newHoras);
    if (!ativ || !horas || horas <= 0 || valorUst <= 0) return null;
    return calcularItemOrcamento(
      horas,
      parseNumber(ativ.complexidade_ust),
      valorUst,
    );
  })();

  const previewDesconto = (() => {
    const pct = parseFloat(newDesconto);
    if (!orcamento || isNaN(pct)) return null;
    const bruto = parseNumber(orcamento.valor_total_bruto);
    const desc = bruto * (pct / 100);
    return { bruto, desc, liquido: bruto - desc };
  })();

  // ── Loading / not found ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingOverlay text="Carregando orçamento..." />
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <p className="text-lg font-semibold">Orçamento não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/orcamentos")}>
          Voltar para Orçamentos
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <PageHeader
        title={orcamento.numero_orcamento}
        description={`Versão ${orcamento.versao} · Emitido em ${formatDate(orcamento.data_emissao)}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate("/orcamentos")}
            >
              Voltar
            </Button>

            {isRascunho && isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Pencil className="w-4 h-4" />}
                  onClick={() => {
                    setNewDesconto(
                      String(parseNumber(orcamento.desconto_percentual)),
                    );
                    setDescontoMotivo("");
                    setDescontoOpen(true);
                  }}
                >
                  Alterar Desconto
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => setApproveOpen(true)}
                >
                  Aprovar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4 text-red-400" />}
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => setDeleteOpen(true)}
                >
                  Excluir
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Status banner */}
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${
          isAprovado
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        {isAprovado ? (
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
        ) : (
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${isAprovado ? "text-emerald-800" : "text-amber-800"}`}
          >
            {isAprovado
              ? "Orçamento Aprovado — Imutável"
              : "Orçamento em Rascunho — Editável"}
          </p>
          <p
            className={`text-xs mt-0.5 ${isAprovado ? "text-emerald-600" : "text-amber-600"}`}
          >
            {isAprovado
              ? "Este orçamento está finalizado e não pode ser alterado."
              : "Você pode adicionar, editar e remover itens enquanto estiver como rascunho."}
          </p>
        </div>
        <Badge
          variant={statusOrcamentoBadge(orcamento.status)}
          dot
          className="shrink-0"
        >
          {orcamento.status}
        </Badge>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardBody>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Contrato
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                      {contrato?.numero_contrato ?? `#${orcamento.contrato_id}`}
                    </p>
                    {contrato && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">
                        {formatCurrency(contrato.valor_ust)} / UST
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 shrink-0">
                    <Calculator className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Projeto
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                      {projeto?.nome ?? `#${orcamento.projeto_id}`}
                    </p>
                    {projeto && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {projeto.codigo}
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Items table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Itens do Orçamento
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                  {orcamento.itens?.length ?? 0}
                </span>
              </CardTitle>
              {isRascunho && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setNewAtividadeId("");
                    setNewHoras("");
                    setNewItemObs("");
                    setAddItemOpen(true);
                  }}
                >
                  Adicionar Item
                </Button>
              )}
            </CardHeader>
            <CardBody padding="none">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>#</TableHeaderCell>
                    <TableHeaderCell>Atividade</TableHeaderCell>
                    <TableHeaderCell align="right">
                      Complexidade
                    </TableHeaderCell>
                    <TableHeaderCell align="right">Horas</TableHeaderCell>
                    <TableHeaderCell align="right">
                      Subtotal UST
                    </TableHeaderCell>
                    <TableHeaderCell align="right">
                      Subtotal Bruto
                    </TableHeaderCell>
                    {isRascunho && (
                      <TableHeaderCell align="right">Ações</TableHeaderCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!orcamento.itens || orcamento.itens.length === 0 ? (
                    <TableEmpty
                      colSpan={isRascunho ? 7 : 6}
                      message="Nenhum item adicionado."
                      icon={<Zap className="w-10 h-10" />}
                    />
                  ) : (
                    orcamento.itens.map((item) => {
                      const ativ = atividadeMap[item.atividade_id];
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-slate-400 w-10">
                            {item.sequencia}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-800">
                                {ativ?.nome ??
                                  `Atividade #${item.atividade_id}`}
                              </p>
                              {item.observacoes && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {item.observacoes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell align="right">
                            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              {parseNumber(item.complexidade_snapshot).toFixed(
                                4,
                              )}{" "}
                              UST
                            </span>
                          </TableCell>
                          <TableCell align="right">
                            <span className="font-medium text-slate-700">
                              {parseNumber(item.horas_estimadas).toFixed(2)}h
                            </span>
                          </TableCell>
                          <TableCell align="right">
                            <span className="text-slate-600">
                              {parseNumber(item.subtotal_ust).toFixed(4)}
                            </span>
                          </TableCell>
                          <TableCell align="right">
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(item.subtotal_bruto)}
                            </span>
                          </TableCell>
                          {isRascunho && (
                            <TableCell align="right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  icon={<Pencil className="w-3 h-3" />}
                                  onClick={() => {
                                    setEditHorasTarget(item);
                                    setEditHoras(
                                      String(parseNumber(item.horas_estimadas)),
                                    );
                                    setEditMotivo("");
                                  }}
                                >
                                  Horas
                                </Button>
                                {orcamento.itens.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    icon={
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                    }
                                    className="text-red-500 hover:bg-red-50"
                                    onClick={() => setDeleteItemTarget(item)}
                                  />
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          {/* Observations */}
          {orcamento.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {orcamento.observacoes}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Audit toggle */}
          <button
            onClick={() => setShowAuditoria((v) => !v)}
            className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            <History className="w-4 h-4" />
            {showAuditoria
              ? "Ocultar histórico"
              : "Ver histórico de alterações"}
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showAuditoria ? "rotate-90" : ""}`}
            />
          </button>

          {showAuditoria && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  Histórico de Auditoria
                </CardTitle>
              </CardHeader>
              <CardBody padding="none">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Data</TableHeaderCell>
                      <TableHeaderCell>Tipo</TableHeaderCell>
                      <TableHeaderCell align="right">Anterior</TableHeaderCell>
                      <TableHeaderCell align="right">Novo</TableHeaderCell>
                      <TableHeaderCell>Motivo</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditoria.length === 0 ? (
                      <TableEmpty
                        colSpan={5}
                        message="Sem registros de auditoria."
                        icon={<History className="w-8 h-8" />}
                      />
                    ) : (
                      auditoria.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="text-xs text-slate-500">
                            {formatDateTime(reg.data_alteracao)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                reg.tipo_alteracao === "DESCONTO_ORCAMENTO"
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {reg.tipo_alteracao === "DESCONTO_ORCAMENTO"
                                ? "Desconto"
                                : "Horas"}
                            </Badge>
                          </TableCell>
                          <TableCell
                            align="right"
                            className="text-xs text-slate-500"
                          >
                            {parseNumber(reg.valor_anterior).toFixed(4)}
                          </TableCell>
                          <TableCell
                            align="right"
                            className="text-xs font-semibold text-slate-800"
                          >
                            {parseNumber(reg.valor_novo).toFixed(4)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-400 max-w-xs truncate">
                            {reg.motivo ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right: financial summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-brand-600" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardBody>
              <ValueRow
                label="Valor Total Bruto"
                value={formatCurrency(orcamento.valor_total_bruto)}
              />
              <ValueRow
                label={`Desconto (${parseNumber(orcamento.desconto_percentual).toFixed(2)}%)`}
                value={`− ${formatCurrency(
                  parseNumber(orcamento.valor_total_bruto) *
                    (parseNumber(orcamento.desconto_percentual) / 100),
                )}`}
                negative
              />
              <ValueRow
                label="Valor Total Líquido"
                value={formatCurrency(orcamento.valor_total_liquido)}
                highlight
              />

              {valorUst > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-brand-50 border border-brand-200">
                  <p className="text-xs font-semibold text-brand-700 mb-1">
                    Valor da UST
                  </p>
                  <p className="text-lg font-bold text-brand-800">
                    {formatCurrency(valorUst)}
                  </p>
                  <p className="text-xs text-brand-600 mt-0.5">
                    por Unidade de Serviço Técnico
                  </p>
                </div>
              )}
            </CardBody>

            {isRascunho && isAdmin && (
              <CardFooter>
                <Button
                  variant="success"
                  className="w-full"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => setApproveOpen(true)}
                >
                  Aprovar Orçamento
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Approve */}
      <ConfirmDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={() => approveMutation.mutate()}
        loading={approveMutation.isPending}
        variant="warning"
        title="Aprovar orçamento?"
        message={`Ao aprovar "${orcamento.numero_orcamento}", ele ficará imutável e não poderá mais ser editado. Confirma?`}
        confirmLabel="Aprovar"
        cancelLabel="Cancelar"
      />

      {/* Delete orcamento */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title="Excluir orçamento?"
        message={`Deseja excluir "${orcamento.numero_orcamento}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />

      {/* Delete item */}
      <ConfirmDialog
        open={!!deleteItemTarget}
        onClose={() => setDeleteItemTarget(null)}
        onConfirm={() => deleteItemMutation.mutate()}
        loading={deleteItemMutation.isPending}
        title="Remover item?"
        message={`Deseja remover o item "${
          deleteItemTarget
            ? (atividadeMap[deleteItemTarget.atividade_id]?.nome ??
              `#${deleteItemTarget.atividade_id}`)
            : ""
        }"?`}
        confirmLabel="Remover"
      />

      {/* Edit discount */}
      <Modal
        open={descontoOpen}
        onClose={() => setDescontoOpen(false)}
        title="Alterar Desconto"
        description={`Orçamento: ${orcamento.numero_orcamento}`}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Novo Desconto (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={newDesconto}
            onChange={(e) => setNewDesconto(e.target.value)}
            hint={`Desconto atual: ${parseNumber(orcamento.desconto_percentual).toFixed(2)}%`}
          />
          <Input
            label="Motivo (opcional)"
            placeholder="Justificativa da alteração..."
            value={descontoMotivo}
            onChange={(e) => setDescontoMotivo(e.target.value)}
          />

          {previewDesconto && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Preview
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Valor bruto</span>
                <span className="font-medium">
                  {formatCurrency(previewDesconto.bruto)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Desconto ({parseFloat(newDesconto).toFixed(2)}%)
                </span>
                <span className="text-amber-600 font-medium">
                  − {formatCurrency(previewDesconto.desc)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-1.5">
                <span className="text-slate-800">Valor Líquido</span>
                <span className="text-emerald-700">
                  {formatCurrency(previewDesconto.liquido)}
                </span>
              </div>
            </div>
          )}

          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDescontoOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={descontoMutation.isPending}
              onClick={() => descontoMutation.mutate()}
              disabled={!newDesconto || isNaN(parseFloat(newDesconto))}
            >
              Salvar Desconto
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Add item */}
      <Modal
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        title="Adicionar Item"
        description={`Orçamento: ${orcamento.numero_orcamento}`}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Atividade"
            required
            placeholder="Selecione uma atividade"
            value={newAtividadeId}
            onChange={(e) => setNewAtividadeId(e.target.value)}
            options={atividades.map((a) => ({
              value: a.id,
              label: `${a.nome} (${parseNumber(a.complexidade_ust)} UST)`,
            }))}
          />

          <Input
            label="Horas Estimadas"
            type="number"
            step="0.5"
            min="0"
            placeholder="Ex: 16.0"
            required
            value={newHoras}
            onChange={(e) => setNewHoras(e.target.value)}
          />

          <Input
            label="Observações (opcional)"
            placeholder="Notas deste item..."
            value={newItemObs}
            onChange={(e) => setNewItemObs(e.target.value)}
          />

          {previewNewItem && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white border border-slate-200">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {parseNumber(
                    atividadeMap[parseInt(newAtividadeId)]?.complexidade_ust,
                  ).toFixed(4)}
                </span>{" "}
                UST/h
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {previewNewItem.subtotalUst.toFixed(4)}
                </span>{" "}
                UST total
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(previewNewItem.subtotalBruto)}
                </span>{" "}
                bruto
              </div>
            </div>
          )}

          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddItemOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={addItemMutation.isPending}
              onClick={() => addItemMutation.mutate()}
              disabled={
                !newAtividadeId || !newHoras || parseFloat(newHoras) <= 0
              }
            >
              Adicionar Item
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Edit horas */}
      <Modal
        open={!!editHorasTarget}
        onClose={() => setEditHorasTarget(null)}
        title="Editar Horas Estimadas"
        description={
          editHorasTarget
            ? (atividadeMap[editHorasTarget.atividade_id]?.nome ??
              `Item #${editHorasTarget.id}`)
            : ""
        }
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Novas Horas Estimadas"
            type="number"
            step="0.5"
            min="0"
            value={editHoras}
            onChange={(e) => setEditHoras(e.target.value)}
            hint={
              editHorasTarget
                ? `Horas atuais: ${parseNumber(editHorasTarget.horas_estimadas).toFixed(2)}h`
                : ""
            }
          />
          <Input
            label="Motivo (opcional)"
            placeholder="Justificativa da alteração..."
            value={editMotivo}
            onChange={(e) => setEditMotivo(e.target.value)}
          />

          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditHorasTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={editHorasMutation.isPending}
              onClick={() => editHorasMutation.mutate()}
              disabled={!editHoras || parseFloat(editHoras) <= 0}
            >
              Salvar Horas
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
