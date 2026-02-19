import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Calculator,
  ChevronRight,
  Info,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

import { orcamentosApi } from "@/api/orders";
import { contratosApi } from "@/api/contracts";
import { projetosApi } from "@/api/projects";
import { catalogoApi } from "@/api/catalog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { extractErrorMessage } from "@/api/client";
import {
  formatCurrency,
  parseNumber,
  calcularItemOrcamento,
  calcularTotaisOrcamento,
} from "@/lib/utils";
import type { Catalogo } from "@/types";

// ── Schema ─────────────────────────────────────────────────────────────────────
const itemSchema = z.object({
  atividade_id: z.coerce.number().min(1, "Selecione uma atividade"),
  horas_estimadas: z.coerce.number().min(0.01, "Informe as horas (> 0)"),
  observacoes: z.string().optional(),
});

const schema = z.object({
  projeto_id: z.coerce.number().min(1, "Selecione um projeto"),
  contrato_id: z.coerce.number().min(1, "Selecione um contrato"),
  desconto_percentual: z.coerce.number().min(0).max(100),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item"),
});

type FormData = z.infer<typeof schema>;

// ── Helpers ────────────────────────────────────────────────────────────────────
function getAtividadeComplexidade(atividades: Catalogo[], id: number): number {
  const found = atividades.find((a) => a.id === id);
  return found ? parseNumber(found.complexidade_ust) : 0;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function OrderCreatePage() {
  const navigate = useNavigate();
  const [selectedContratoValorUst, setSelectedContratoValorUst] =
    useState<number>(0);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: projetos = [] } = useQuery({
    queryKey: ["projetos"],
    queryFn: () => projetosApi.listar({ limit: 100 }),
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ["contratos"],
    queryFn: () => contratosApi.listar({ limit: 100, status: "ativo" }),
  });

  const { data: atividades = [] } = useQuery({
    queryKey: ["catalogo", "ATIVIDADE"],
    queryFn: () => catalogoApi.listarPorTipo("ATIVIDADE"),
  });

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      projeto_id: 0,
      contrato_id: 0,
      desconto_percentual: 0,
      observacoes: "",
      itens: [{ atividade_id: 0, horas_estimadas: 0, observacoes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const watchedItens = watch("itens");
  const watchedDesconto = watch("desconto_percentual");
  const watchedContratoId = watch("contrato_id");
  const watchedProjetoId = watch("projeto_id");

  // Sync valor_ust when contrato changes
  useEffect(() => {
    const contrato = contratos.find((c) => c.id === Number(watchedContratoId));
    setSelectedContratoValorUst(contrato ? parseNumber(contrato.valor_ust) : 0);
  }, [watchedContratoId, contratos]);

  // Auto-fill contrato from selected project
  useEffect(() => {
    const projeto = projetos.find((p) => p.id === Number(watchedProjetoId));
    if (projeto?.contrato_id) {
      setValue("contrato_id", projeto.contrato_id);
    }
  }, [watchedProjetoId, projetos, setValue]);

  // ── Real-time calculation ─────────────────────────────────────────────────
  const calculatedItens = (watchedItens ?? []).map((item) => {
    const complexidade = getAtividadeComplexidade(
      atividades,
      Number(item.atividade_id),
    );
    const horas = parseNumber(item.horas_estimadas);
    const { subtotalUst, subtotalBruto } = calcularItemOrcamento(
      horas,
      complexidade,
      selectedContratoValorUst,
    );
    return { complexidade, subtotalUst, subtotalBruto };
  });

  const totais = calcularTotaisOrcamento(
    calculatedItens.map((i) => ({ subtotalBruto: i.subtotalBruto })),
    parseNumber(watchedDesconto),
  );

  // ── Mutation ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: orcamentosApi.criar,
    onSuccess: (orc) => {
      toast.success(`Orçamento ${orc.numero_orcamento} criado!`);
      navigate(`/orcamentos/${orc.id}`);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      projeto_id: data.projeto_id,
      contrato_id: data.contrato_id,
      desconto_percentual: data.desconto_percentual,
      observacoes: data.observacoes || null,
      itens: data.itens.map((item) => ({
        atividade_id: item.atividade_id,
        horas_estimadas: item.horas_estimadas,
        observacoes: item.observacoes || null,
      })),
    });
  };

  // ── Options ───────────────────────────────────────────────────────────────
  const projetoOptions = projetos.map((p) => ({
    value: p.id,
    label: `${p.codigo} — ${p.nome}`,
  }));

  const contratoOptions = contratos.map((c) => ({
    value: c.id,
    label: `${c.numero_contrato} (UST: ${formatCurrency(c.valor_ust)})`,
  }));

  const atividadeOptions = atividades.map((a) => ({
    value: a.id,
    label: `${a.nome} (${parseNumber(a.complexidade_ust)} UST)`,
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <PageHeader
        title="Novo Orçamento"
        description="Preencha os dados e adicione as atividades do orçamento"
        actions={
          <Button
            variant="outline"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate("/orcamentos")}
          >
            Voltar
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column: form ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header data */}
            <Card>
              <CardHeader>
                <CardTitle>Dados do Orçamento</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Projeto"
                    required
                    placeholder="Selecione um projeto"
                    error={errors.projeto_id?.message}
                    options={projetoOptions}
                    {...register("projeto_id")}
                  />

                  <Select
                    label="Contrato"
                    required
                    placeholder="Selecione um contrato"
                    error={errors.contrato_id?.message}
                    options={contratoOptions}
                    {...register("contrato_id")}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Desconto (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    error={errors.desconto_percentual?.message}
                    hint="Percentual de desconto sobre o valor bruto"
                    {...register("desconto_percentual")}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Valor UST do Contrato
                    </label>
                    <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span
                        className={
                          selectedContratoValorUst > 0
                            ? "text-sm font-semibold text-emerald-700"
                            : "text-sm text-slate-400"
                        }
                      >
                        {selectedContratoValorUst > 0
                          ? formatCurrency(selectedContratoValorUst)
                          : "Selecione um contrato"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Input
                    label="Observações (opcional)"
                    placeholder="Notas gerais do orçamento..."
                    {...register("observacoes")}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Itens do Orçamento
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                    {fields.length}
                  </span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  type="button"
                  onClick={() =>
                    append({
                      atividade_id: 0,
                      horas_estimadas: 0,
                      observacoes: "",
                    })
                  }
                >
                  Adicionar Item
                </Button>
              </CardHeader>

              {errors.itens?.root && (
                <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">
                    {errors.itens.root.message}
                  </p>
                </div>
              )}

              <CardBody className="space-y-4">
                {fields.map((field, index) => {
                  const calc = calculatedItens[index];
                  const hasActivity =
                    Number(watchedItens?.[index]?.atividade_id) > 0;
                  const hasHours =
                    parseNumber(watchedItens?.[index]?.horas_estimadas) > 0;

                  return (
                    <div
                      key={field.id}
                      className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                    >
                      {/* Item header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">
                            Item {index + 1}
                          </span>
                          {hasActivity && hasHours && calc && (
                            <Badge variant="info" className="ml-1">
                              {formatCurrency(calc.subtotalBruto)}
                            </Badge>
                          )}
                        </div>

                        {fields.length > 1 && (
                          <Button
                            variant="ghost"
                            size="xs"
                            type="button"
                            icon={
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            }
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => remove(index)}
                          >
                            Remover
                          </Button>
                        )}
                      </div>

                      {/* Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                          label="Atividade"
                          required
                          placeholder="Selecione uma atividade"
                          error={errors.itens?.[index]?.atividade_id?.message}
                          options={atividadeOptions}
                          {...register(`itens.${index}.atividade_id`)}
                        />

                        <Input
                          label="Horas Estimadas"
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="Ex: 16.0"
                          required
                          error={
                            errors.itens?.[index]?.horas_estimadas?.message
                          }
                          {...register(`itens.${index}.horas_estimadas`)}
                        />
                      </div>

                      <div className="mt-3">
                        <Input
                          label="Observações do item (opcional)"
                          placeholder="Notas específicas deste item..."
                          {...register(`itens.${index}.observacoes`)}
                        />
                      </div>

                      {/* Real-time preview */}
                      {hasActivity &&
                        hasHours &&
                        calc &&
                        selectedContratoValorUst > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white border border-slate-200">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Zap className="w-3 h-3 text-amber-500" />
                              <span>
                                <span className="font-semibold text-slate-700">
                                  {calc.complexidade.toFixed(4)}
                                </span>{" "}
                                UST/h
                              </span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <div className="text-xs text-slate-500">
                              <span className="font-semibold text-slate-700">
                                {calc.subtotalUst.toFixed(4)}
                              </span>{" "}
                              UST total
                            </div>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <div className="text-xs text-slate-500">
                              <span className="font-semibold text-emerald-700">
                                {formatCurrency(calc.subtotalBruto)}
                              </span>{" "}
                              bruto
                            </div>
                          </div>
                        )}

                      {hasActivity && selectedContratoValorUst === 0 && (
                        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-xs text-amber-700">
                            Selecione um contrato para ver o cálculo em tempo
                            real.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add more button */}
                <button
                  type="button"
                  onClick={() =>
                    append({
                      atividade_id: 0,
                      horas_estimadas: 0,
                      observacoes: "",
                    })
                  }
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all duration-150 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar mais um item
                </button>
              </CardBody>
            </Card>
          </div>

          {/* ── Right column: summary ─────────────────────────────────── */}
          <div className="space-y-4">
            {/* Totals card */}
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-brand-600" />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardBody>
                {/* Items breakdown */}
                <div className="space-y-2 mb-4">
                  {calculatedItens.map((calc, index) => {
                    const ativId = Number(watchedItens?.[index]?.atividade_id);
                    const ativ = atividades.find((a) => a.id === ativId);
                    const horas = parseNumber(
                      watchedItens?.[index]?.horas_estimadas,
                    );
                    if (!ativ || horas <= 0) return null;
                    return (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-2 text-xs py-2 border-b border-slate-100 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-700 truncate">
                            {index + 1}. {ativ.nome}
                          </p>
                          <p className="text-slate-400 mt-0.5">
                            {horas}h × {calc.complexidade} UST/h ={" "}
                            {calc.subtotalUst.toFixed(4)} UST
                          </p>
                        </div>
                        <span className="font-semibold text-slate-700 shrink-0">
                          {formatCurrency(calc.subtotalBruto)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Valor Bruto</span>
                    <span className="font-medium">
                      {formatCurrency(totais.valorTotalBruto)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm text-slate-600">
                    <span>
                      Desconto ({parseNumber(watchedDesconto).toFixed(2)}%)
                    </span>
                    <span className="font-medium text-amber-600">
                      − {formatCurrency(totais.valorDesconto)}
                    </span>
                  </div>

                  <div className="h-px bg-slate-200 my-1" />

                  <div className="flex justify-between text-base font-bold text-slate-900">
                    <span>Valor Líquido</span>
                    <span className="text-emerald-700">
                      {formatCurrency(totais.valorTotalLiquido)}
                    </span>
                  </div>
                </div>

                {/* UST info */}
                {selectedContratoValorUst > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-brand-50 border border-brand-200">
                    <p className="text-xs font-semibold text-brand-700 mb-1">
                      Valor da UST
                    </p>
                    <p className="text-lg font-bold text-brand-800">
                      {formatCurrency(selectedContratoValorUst)}
                    </p>
                    <p className="text-xs text-brand-600 mt-0.5">
                      por Unidade de Serviço Técnico
                    </p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full mt-5"
                  size="lg"
                  loading={isSubmitting || createMutation.isPending}
                  icon={<Calculator className="w-4 h-4" />}
                >
                  Criar Orçamento
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full mt-2"
                  size="sm"
                  onClick={() => navigate("/orcamentos")}
                >
                  Cancelar
                </Button>
              </CardBody>
            </Card>

            {/* Formula explanation */}
            <Card>
              <CardBody>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Fórmula UST
                </p>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg font-mono">
                    <span className="text-slate-400">UST item</span>
                    <span className="text-slate-400">=</span>
                    <span className="text-amber-600">complexidade</span>
                    <span className="text-slate-400">×</span>
                    <span className="text-blue-600">horas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg font-mono">
                    <span className="text-slate-400">Valor bruto</span>
                    <span className="text-slate-400">=</span>
                    <span className="text-purple-600">UST item</span>
                    <span className="text-slate-400">×</span>
                    <span className="text-emerald-600">valor UST</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
