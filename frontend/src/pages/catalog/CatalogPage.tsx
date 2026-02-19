import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  GitBranch,
  Zap,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

import { catalogoApi } from "@/api/catalog";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, tipoCatalogoBadge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { LoadingOverlay } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/api/client";
import { formatDecimal } from "@/lib/utils";
import type { Catalogo, CatalogoTipo } from "@/types";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z
  .object({
    nome: z.string().min(2, "Nome obrigatório"),
    tipo: z.enum(["CICLO", "FASE", "ATIVIDADE"], {
      required_error: "Selecione o tipo",
    }),
    parent_id: z.preprocess(
      (v) => {
        if (v === "" || v === null || v === undefined) return null;
        const num = Number(v);
        return isNaN(num) ? null : num;
      },
      z.number().int().positive().nullable().optional(),
    ),
    complexidade_ust: z.preprocess(
      (v) => {
        if (v === "" || v === null || v === undefined) return null;
        const num = Number(v);
        return isNaN(num) ? null : num;
      },
      z.number().min(0).nullable().optional(),
    ),
  })
  .refine(
    (data) => {
      if (data.tipo === "FASE" && !data.parent_id) return false;
      return true;
    },
    { message: "Fase precisa de um Ciclo pai", path: ["parent_id"] },
  )
  .refine(
    (data) => {
      if (data.tipo === "ATIVIDADE" && !data.parent_id) return false;
      return true;
    },
    { message: "Atividade precisa de uma Fase pai", path: ["parent_id"] },
  )
  .refine(
    (data) => {
      if (
        data.tipo === "ATIVIDADE" &&
        (data.complexidade_ust === null || data.complexidade_ust === undefined)
      )
        return false;
      return true;
    },
    {
      message: "Complexidade UST é obrigatória para Atividade",
      path: ["complexidade_ust"],
    },
  );

type FormData = z.infer<typeof schema>;

// ── Tree node component ───────────────────────────────────────────────────────
interface TreeNodeProps {
  item: Catalogo;
  children: Catalogo[];
  grandchildren: Map<number, Catalogo[]>;
  onEdit: (item: Catalogo) => void;
  onDelete: (item: Catalogo) => void;
  onAddChild: (parent: Catalogo) => void;
  depth?: number;
}

function TreeNode({
  item,
  children,
  grandchildren,
  onEdit,
  onDelete,
  onAddChild,
  depth = 0,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children.length > 0;

  const typeIcon = {
    CICLO: <Layers className="w-4 h-4 text-blue-500" />,
    FASE: <GitBranch className="w-4 h-4 text-purple-500" />,
    ATIVIDADE: <Zap className="w-4 h-4 text-amber-500" />,
  }[item.tipo];

  const addChildLabel = {
    CICLO: "Adicionar Fase",
    FASE: "Adicionar Atividade",
    ATIVIDADE: null,
  }[item.tipo];

  return (
    <div>
      {/* Row */}
      <div
        className={`group flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors ${
          depth === 0 ? "" : depth === 1 ? "ml-7" : "ml-14"
        }`}
      >
        {/* Expand toggle */}
        <button
          className="shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => hasChildren && setExpanded((v) => !v)}
          aria-label={expanded ? "Recolher" : "Expandir"}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : (
            <span className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Icon */}
        <span className="shrink-0">{typeIcon}</span>

        {/* Name */}
        <span
          className={`flex-1 text-sm font-medium ${
            depth === 0
              ? "text-slate-900"
              : depth === 1
                ? "text-slate-800"
                : "text-slate-700"
          }`}
        >
          {item.nome}
        </span>

        {/* Badge */}
        <Badge variant={tipoCatalogoBadge(item.tipo)} className="shrink-0">
          {item.tipo}
        </Badge>

        {/* UST for activities */}
        {item.tipo === "ATIVIDADE" && item.complexidade_ust !== null && (
          <span className="shrink-0 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
            {formatDecimal(item.complexidade_ust, 4)} UST
          </span>
        )}

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {addChildLabel && (
            <Button
              variant="ghost"
              size="xs"
              icon={<Plus className="w-3 h-3 text-brand-500" />}
              className="text-brand-600 hover:bg-brand-50"
              onClick={() => onAddChild(item)}
            >
              {addChildLabel}
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            icon={<Pencil className="w-3 h-3" />}
            onClick={() => onEdit(item)}
          />
          <Button
            variant="ghost"
            size="xs"
            icon={<Trash2 className="w-3 h-3 text-red-400" />}
            className="hover:bg-red-50"
            onClick={() => onDelete(item)}
          />
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              children={grandchildren.get(child.id) ?? []}
              grandchildren={new Map()}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function CatalogPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Catalogo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Catalogo | null>(null);
  const [preselectedParent, setPreselectedParent] = useState<Catalogo | null>(
    null,
  );
  const [preselectedTipo, setPreselectedTipo] = useState<CatalogoTipo>("CICLO");

  // ── Query ─────────────────────────────────────────────────────────────────
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["catalogo"],
    queryFn: () => catalogoApi.listar({ limit: 100 }),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: catalogoApi.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
      toast.success("Item criado com sucesso!");
      closeModal();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      catalogoApi.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
      toast.success("Item atualizado!");
      closeModal();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: catalogoApi.deletar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
      toast.success("Item removido.");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedTipo = watch("tipo");

  const openCreate = () => {
    setEditTarget(null);
    setPreselectedParent(null);
    setPreselectedTipo("CICLO");
    reset({ nome: "", tipo: "CICLO", parent_id: null, complexidade_ust: null });
    setModalOpen(true);
  };

  const openAddChild = (parent: Catalogo) => {
    setEditTarget(null);
    setPreselectedParent(parent);
    const childTipo: CatalogoTipo =
      parent.tipo === "CICLO" ? "FASE" : "ATIVIDADE";
    setPreselectedTipo(childTipo);
    reset({
      nome: "",
      tipo: childTipo,
      parent_id: parent.id,
      complexidade_ust: childTipo === "ATIVIDADE" ? 0 : null,
    });
    setModalOpen(true);
  };

  const openEdit = (item: Catalogo) => {
    setEditTarget(item);
    setPreselectedParent(null);
    reset({
      nome: item.nome,
      tipo: item.tipo,
      parent_id: item.parent_id ?? null,
      complexidade_ust:
        item.complexidade_ust !== null ? Number(item.complexidade_ust) : null,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setPreselectedParent(null);
    reset();
  };

  const onSubmit = (data: FormData) => {
    if (editTarget) {
      const payload = {
        id: editTarget.id,
        data: {
          nome: data.nome,
          complexidade_ust:
            editTarget.tipo === "ATIVIDADE"
              ? (data.complexidade_ust && Number(data.complexidade_ust) > 0 ? Number(data.complexidade_ust) : 0)
              : undefined,
        },
      };
      console.log('[FORM] Enviando UPDATE:', JSON.stringify(payload, null, 2));
      updateMutation.mutate(payload);
    } else {
      const payload = {
        nome: data.nome,
        tipo: data.tipo,
        parent_id: data.parent_id ? Number(data.parent_id) : null,
        complexidade_ust:
          data.tipo === "ATIVIDADE" 
            ? (data.complexidade_ust ? Number(data.complexidade_ust) : 0)
            : null,
      };
      console.log('[FORM] Enviando CREATE:', JSON.stringify(payload, null, 2));
      createMutation.mutate(payload);
    }
  };

  // ── Tree building ─────────────────────────────────────────────────────────
  const ciclos = allItems.filter((i) => i.tipo === "CICLO");
  const fases = allItems.filter((i) => i.tipo === "FASE");
  const atividades = allItems.filter((i) => i.tipo === "ATIVIDADE");

  // Map fase_id → atividades
  const atividadesByFase = new Map<number, Catalogo[]>();
  atividades.forEach((a) => {
    if (a.parent_id !== null) {
      const arr = atividadesByFase.get(a.parent_id) ?? [];
      arr.push(a);
      atividadesByFase.set(a.parent_id, arr);
    }
  });

  // Map ciclo_id → fases
  const fasesByCiclo = new Map<number, Catalogo[]>();
  fases.forEach((f) => {
    if (f.parent_id !== null) {
      const arr = fasesByCiclo.get(f.parent_id) ?? [];
      arr.push(f);
      fasesByCiclo.set(f.parent_id, arr);
    }
  });

  // Search filter
  const searchLower = search.toLowerCase();
  const filteredCiclos =
    search.trim() === ""
      ? ciclos
      : ciclos.filter(
          (c) =>
            c.nome.toLowerCase().includes(searchLower) ||
            (fasesByCiclo.get(c.id) ?? []).some(
              (f) =>
                f.nome.toLowerCase().includes(searchLower) ||
                (atividadesByFase.get(f.id) ?? []).some((a) =>
                  a.nome.toLowerCase().includes(searchLower),
                ),
            ),
        );

  // Selector options
  const cicloOptions = ciclos.map((c) => ({
    value: c.id,
    label: `📁 ${c.nome}`,
  }));
  const faseOptions = fases.map((f) => ({
    value: f.id,
    label: `📂 ${f.nome}`,
  }));

  const counts = {
    ciclos: ciclos.length,
    fases: fases.length,
    atividades: atividades.length,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Catálogo de Serviços"
        description="Hierarquia de Ciclos, Fases e Atividades"
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Novo Item
          </Button>
        }
      />

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-2.5">
          <Layers className="w-4 h-4" />
          <span className="text-sm font-semibold">{counts.ciclos} Ciclos</span>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl px-4 py-2.5">
          <GitBranch className="w-4 h-4" />
          <span className="text-sm font-semibold">{counts.fases} Fases</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2.5">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {counts.atividades} Atividades
          </span>
        </div>
      </div>

      <Card>
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Buscar no catálogo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        <CardBody padding="sm">
          {isLoading ? (
            <LoadingOverlay />
          ) : filteredCiclos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <BookOpen className="w-12 h-12 text-slate-200" />
              <p className="text-sm">
                {search
                  ? "Nenhum resultado encontrado."
                  : "Nenhum item cadastrado."}
              </p>
              {!search && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={openCreate}
                >
                  Criar primeiro Ciclo
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCiclos.map((ciclo) => (
                <TreeNode
                  key={ciclo.id}
                  item={ciclo}
                  children={fasesByCiclo.get(ciclo.id) ?? []}
                  grandchildren={atividadesByFase}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onAddChild={openAddChild}
                  depth={0}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? "Editar Item" : "Novo Item do Catálogo"}
        description={
          preselectedParent
            ? `Adicionando filho de: ${preselectedParent.nome}`
            : editTarget
              ? `Editando: ${editTarget.nome}`
              : "Preencha os dados para cadastrar um novo item."
        }
        size="md"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <Input
            label="Nome"
            placeholder="Ex: Análise de Requisitos"
            required
            error={errors.nome?.message}
            {...register("nome")}
          />

          {/* Tipo — only editable on create */}
          {!editTarget && (
            <Select
              label="Tipo"
              required
              error={errors.tipo?.message}
              options={[
                { value: "CICLO", label: "📁 Ciclo" },
                { value: "FASE", label: "📂 Fase" },
                { value: "ATIVIDADE", label: "⚡ Atividade" },
              ]}
              {...register("tipo", {
                onChange: (e) => {
                  const tipo = e.target.value as CatalogoTipo;
                  setValue("parent_id", null);
                  if (tipo !== "ATIVIDADE") setValue("complexidade_ust", null);
                },
              })}
            />
          )}

          {/* Parent selector */}
          {!editTarget && selectedTipo === "FASE" && (
            <Select
              label="Ciclo pai"
              required
              placeholder="Selecione um ciclo"
              error={errors.parent_id?.message}
              options={cicloOptions}
              {...register("parent_id")}
            />
          )}

          {!editTarget && selectedTipo === "ATIVIDADE" && (
            <Select
              label="Fase pai"
              required
              placeholder="Selecione uma fase"
              error={errors.parent_id?.message}
              options={faseOptions}
              {...register("parent_id")}
            />
          )}

          {/* Complexidade UST — only for atividade */}
          {(selectedTipo === "ATIVIDADE" ||
            editTarget?.tipo === "ATIVIDADE") && (
            <Input
              label="Complexidade UST"
              type="number"
              step="0.0001"
              min="0"
              placeholder="Ex: 2.5000"
              required
              error={errors.complexidade_ust?.message}
              hint="Multiplicador técnico da atividade (ex: 2.5 = 2.5 USTs por hora)"
              {...register("complexidade_ust")}
            />
          )}

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
              {editTarget ? "Salvar Alterações" : "Criar Item"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Excluir item?"
        message={`Deseja excluir "${deleteTarget?.nome}"? Itens com filhos não podem ser excluídos.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
