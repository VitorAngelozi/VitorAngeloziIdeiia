import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  Search,
  PowerOff,
} from "lucide-react";
import toast from "react-hot-toast";

import { projetosApi } from "@/api/projects";
import { clientesApi } from "@/api/clients";
import { contratosApi } from "@/api/contracts";
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
import type { Projeto } from "@/types";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  codigo: z.string().min(1, "Código obrigatório"),
  cliente_id: z.coerce.number().min(1, "Selecione um cliente"),
  contrato_id: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().nullable().optional(),
  ),
  status: z.string().min(1, "Selecione o status"),
});

type FormData = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────
export function ProjectsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Projeto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Projeto | null>(null);
  const [desativarTarget, setDesativarTarget] = useState<Projeto | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: projetos = [], isLoading } = useQuery({
    queryKey: ["projetos"],
    queryFn: () => projetosApi.listar({ limit: 100 }),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => clientesApi.listar({ limit: 100 }),
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ["contratos"],
    queryFn: () => contratosApi.listar({ limit: 100 }),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: projetosApi.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto criado com sucesso!");
      closeModal();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { nome?: string; status?: string };
    }) => projetosApi.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto atualizado!");
      closeModal();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const desativarMutation = useMutation({
    mutationFn: projetosApi.desativar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto desativado.");
      setDesativarTarget(null);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: projetosApi.deletar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto removido.");
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
      nome: "",
      codigo: "",
      cliente_id: 0,
      contrato_id: null,
      status: "ativo",
    });
    setModalOpen(true);
  };

  const openEdit = (projeto: Projeto) => {
    setEditTarget(projeto);
    reset({
      nome: projeto.nome,
      codigo: projeto.codigo,
      cliente_id: projeto.cliente_id,
      contrato_id: projeto.contrato_id ?? null,
      status: projeto.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    reset();
  };

  const onSubmit = (data: FormData) => {
    if (editTarget) {
      // Only nome and status are editable after creation
      updateMutation.mutate({
        id: editTarget.id,
        data: { nome: data.nome, status: data.status },
      });
    } else {
      createMutation.mutate({
        nome: data.nome,
        codigo: data.codigo,
        cliente_id: data.cliente_id,
        contrato_id: data.contrato_id ?? null,
        status: data.status,
      });
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clienteMap = Object.fromEntries(
    clientes.map((c) => [c.id, c.razao_social]),
  );
  const contratoMap = Object.fromEntries(
    contratos.map((c) => [c.id, c.numero_contrato]),
  );

  const filtered = projetos.filter((p) => {
    const matchSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? p.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Projetos"
        description="Gerencie os projetos vinculados a clientes e contratos"
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Novo Projeto
          </Button>
        }
      />

      <Card>
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Input
              placeholder="Buscar por nome ou código..."
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
            {filtered.length} {filtered.length === 1 ? "projeto" : "projetos"}
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
                  <TableHeaderCell>Código</TableHeaderCell>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Contrato</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell align="right">Ações</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableEmpty
                    colSpan={7}
                    message="Nenhum projeto encontrado."
                    icon={<FolderOpen className="w-10 h-10" />}
                  />
                ) : (
                  filtered.map((projeto) => (
                    <TableRow key={projeto.id}>
                      <TableCell className="text-slate-400 w-12">
                        {projeto.id}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {projeto.codigo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-800">
                          {projeto.nome}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">
                          {clienteMap[projeto.cliente_id] ??
                            `Cliente #${projeto.cliente_id}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {projeto.contrato_id ? (
                          <span className="text-slate-600">
                            {contratoMap[projeto.contrato_id] ??
                              `Contrato #${projeto.contrato_id}`}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusGenericBadge(projeto.status)} dot>
                          {projeto.status}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => openEdit(projeto)}
                          >
                            Editar
                          </Button>
                          {projeto.status === "ativo" && (
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={
                                <PowerOff className="w-3.5 h-3.5 text-amber-500" />
                              }
                              className="text-amber-600 hover:bg-amber-50"
                              onClick={() => setDesativarTarget(projeto)}
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
                            onClick={() => setDeleteTarget(projeto)}
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
        title={editTarget ? "Editar Projeto" : "Novo Projeto"}
        description={
          editTarget
            ? `Editando: ${editTarget.nome}`
            : "Preencha os dados para cadastrar um novo projeto."
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
              label="Nome do Projeto"
              placeholder="Ex: Sistema de Vendas"
              required
              error={errors.nome?.message}
              {...register("nome")}
            />

            <Input
              label="Código"
              placeholder="Ex: PRJ-2024-001"
              required
              disabled={!!editTarget}
              error={errors.codigo?.message}
              hint={editTarget ? "Código não pode ser alterado" : undefined}
              {...register("codigo")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Cliente"
              required
              placeholder="Selecione um cliente"
              disabled={!!editTarget}
              error={errors.cliente_id?.message}
              options={clientes.map((c) => ({
                value: c.id,
                label: c.razao_social,
              }))}
              {...register("cliente_id")}
            />

            <Select
              label="Contrato (opcional)"
              placeholder="Nenhum contrato"
              disabled={!!editTarget}
              error={errors.contrato_id?.message}
              options={[
                { value: "", label: "Nenhum contrato" },
                ...contratos.map((c) => ({
                  value: c.id,
                  label: c.numero_contrato,
                })),
              ]}
              {...register("contrato_id")}
            />
          </div>

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
              {editTarget ? "Salvar Alterações" : "Criar Projeto"}
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
        title="Desativar projeto?"
        message={`Deseja desativar "${desativarTarget?.nome}"?`}
        confirmLabel="Desativar"
      />

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Excluir projeto?"
        message={`Deseja excluir "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
