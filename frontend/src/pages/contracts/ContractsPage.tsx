import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, FileText, Search, PowerOff } from "lucide-react";
import toast from "react-hot-toast";

import { contratosApi } from "@/api/contracts";
import { clientesApi } from "@/api/clients";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, statusGenericBadge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal, ModalFooter } from "@/components/ui/Modal";
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
import { extractErrorMessage } from "@/api/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Contrato } from "@/types";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  numero_contrato: z.string().min(1, "Número do contrato obrigatório"),
  cliente_id: z.coerce.number().min(1, "Selecione um cliente"),
  valor_ust: z.coerce.number().min(0, "Valor UST deve ser >= 0"),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  status: z.string().min(1, "Selecione o status"),
});

type FormData = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────
export function ContractsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contrato | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contrato | null>(null);
  const [desativarTarget, setDesativarTarget] = useState<Contrato | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: contratos = [], isLoading } = useQuery({
    queryKey: ["contratos"],
    queryFn: () => contratosApi.listar({ limit: 100 }),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => clientesApi.listar({ limit: 100 }),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: contratosApi.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato criado com sucesso!");
      closeModal();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      contratosApi.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato atualizado!");
      closeModal();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const desativarMutation = useMutation({
    mutationFn: contratosApi.desativar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato desativado.");
      setDesativarTarget(null);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: contratosApi.deletar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato removido.");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openCreate = () => {
    setEditTarget(null);
    reset({
      numero_contrato: "",
      cliente_id: 0,
      valor_ust: 0,
      data_inicio: "",
      data_fim: "",
      status: "ativo",
    });
    setModalOpen(true);
  };

  const openEdit = (contrato: Contrato) => {
    setEditTarget(contrato);
    reset({
      numero_contrato: contrato.numero_contrato,
      cliente_id: contrato.cliente_id,
      valor_ust: Number(contrato.valor_ust),
      data_inicio: contrato.data_inicio ?? "",
      data_fim: contrato.data_fim ?? "",
      status: contrato.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    reset();
  };

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      data_inicio: data.data_inicio || undefined,
      data_fim: data.data_fim || undefined,
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = contratos.filter((c) => {
    const matchSearch = c.numero_contrato
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = filterStatus ? c.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const clienteMap = Object.fromEntries(
    clientes.map((c) => [c.id, c.razao_social]),
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Contratos"
        description="Gerencie os contratos e seus valores de UST"
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Novo Contrato
          </Button>
        }
      />

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
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <span className="text-sm text-slate-500 shrink-0">
            {filtered.length} {filtered.length === 1 ? "contrato" : "contratos"}
          </span>
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
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell align="right">Valor UST</TableHeaderCell>
                  <TableHeaderCell>Início</TableHeaderCell>
                  <TableHeaderCell>Vencimento</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell align="right">Ações</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableEmpty
                    colSpan={8}
                    message="Nenhum contrato encontrado."
                    icon={<FileText className="w-10 h-10" />}
                  />
                ) : (
                  filtered.map((contrato) => (
                    <TableRow key={contrato.id}>
                      <TableCell className="text-slate-400 w-12">
                        {contrato.id}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-800">
                          {contrato.numero_contrato}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">
                          {clienteMap[contrato.cliente_id] ??
                            `Cliente #${contrato.cliente_id}`}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <span className="font-semibold text-emerald-700">
                          {formatCurrency(contrato.valor_ust)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(contrato.data_inicio)}</TableCell>
                      <TableCell>{formatDate(contrato.data_fim)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusGenericBadge(contrato.status)}
                          dot
                        >
                          {contrato.status}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => openEdit(contrato)}
                          >
                            Editar
                          </Button>
                          {contrato.status === "ativo" && (
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={
                                <PowerOff className="w-3.5 h-3.5 text-amber-500" />
                              }
                              className="text-amber-600 hover:bg-amber-50"
                              onClick={() => setDesativarTarget(contrato)}
                            >
                              Desativar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            }
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => setDeleteTarget(contrato)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? "Editar Contrato" : "Novo Contrato"}
        description={
          editTarget
            ? `Editando: ${editTarget.numero_contrato}`
            : "Preencha os dados para cadastrar um novo contrato."
        }
        size="lg"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Número do Contrato"
              placeholder="Ex: CT-2024-001"
              required
              error={errors.numero_contrato?.message}
              {...register("numero_contrato")}
            />

            <Select
              label="Cliente"
              required
              placeholder="Selecione um cliente"
              error={errors.cliente_id?.message}
              options={clientes.map((c) => ({
                value: c.id,
                label: c.razao_social,
              }))}
              {...register("cliente_id")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Valor UST (R$)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              error={errors.valor_ust?.message}
              hint="Valor em reais por Unidade de Serviço Técnico"
              {...register("valor_ust")}
            />

            <Select
              label="Status"
              required
              error={errors.status?.message}
              options={[
                { value: "ativo", label: "Ativo" },
                { value: "inativo", label: "Inativo" },
              ]}
              {...register("status")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data de Início"
              type="date"
              error={errors.data_inicio?.message}
              {...register("data_inicio")}
            />

            <Input
              label="Data de Vencimento"
              type="date"
              error={errors.data_fim?.message}
              {...register("data_fim")}
            />
          </div>

          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={closeModal}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={
                isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {editTarget ? "Salvar Alterações" : "Criar Contrato"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ── Desativar Confirm ───────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!desativarTarget}
        onClose={() => setDesativarTarget(null)}
        onConfirm={() =>
          desativarTarget && desativarMutation.mutate(desativarTarget.id)
        }
        loading={desativarMutation.isPending}
        variant="warning"
        title="Desativar contrato?"
        message={`Deseja desativar "${desativarTarget?.numero_contrato}"? Não será possível criar novos orçamentos com este contrato.`}
        confirmLabel="Desativar"
      />

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Excluir contrato?"
        message={`Deseja excluir "${deleteTarget?.numero_contrato}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
