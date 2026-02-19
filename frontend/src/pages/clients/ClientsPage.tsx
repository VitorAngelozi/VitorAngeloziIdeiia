import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Users, Search } from 'lucide-react'
import toast from 'react-hot-toast'

import { clientesApi } from '@/api/clients'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardBody } from '@/components/ui/Card'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table'
import { LoadingOverlay } from '@/components/ui/Spinner'
import { extractErrorMessage } from '@/api/client'
import type { Cliente } from '@/types'

// ── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  razao_social: z.string().min(2, 'Razão social obrigatória'),
  cnpj: z
    .string()
    .min(14, 'CNPJ inválido')
    .max(18, 'CNPJ inválido'),
})

type FormData = z.infer<typeof schema>

// ── Component ────────────────────────────────────────────────────────────────
export function ClientsPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Cliente | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null)

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesApi.listar({ limit: 100 }),
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: clientesApi.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente criado com sucesso!')
      closeModal()
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      clientesApi.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente atualizado!')
      closeModal()
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: clientesApi.deletar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente removido.')
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  // ── Form ───────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const openCreate = () => {
    setEditTarget(null)
    reset({ razao_social: '', cnpj: '' })
    setModalOpen(true)
  }

  const openEdit = (cliente: Cliente) => {
    setEditTarget(cliente)
    reset({ razao_social: cliente.razao_social, cnpj: cliente.cnpj })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    reset()
  }

  const onSubmit = (data: FormData) => {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = clientes.filter(
    (c) =>
      c.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj.includes(search)
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes cadastrados no sistema"
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Novo Cliente
          </Button>
        }
      />

      <Card>
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Buscar por razão social ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <span className="text-sm text-slate-500 shrink-0">
            {filtered.length}{' '}
            {filtered.length === 1 ? 'cliente' : 'clientes'}
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
                  <TableHeaderCell>Razão Social</TableHeaderCell>
                  <TableHeaderCell>CNPJ</TableHeaderCell>
                  <TableHeaderCell align="right">Ações</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableEmpty
                    colSpan={4}
                    message="Nenhum cliente encontrado."
                    icon={<Users className="w-10 h-10" />}
                  />
                ) : (
                  filtered.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="text-slate-400 w-12">
                        {cliente.id}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-800">
                          {cliente.razao_social}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-slate-600 text-sm">
                          {cliente.cnpj}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => openEdit(cliente)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => setDeleteTarget(cliente)}
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

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Editar Cliente' : 'Novo Cliente'}
        description={
          editTarget
            ? `Editando: ${editTarget.razao_social}`
            : 'Preencha os dados para cadastrar um novo cliente.'
        }
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Razão Social"
            placeholder="Ex: Empresa XYZ Ltda"
            required
            error={errors.razao_social?.message}
            {...register('razao_social')}
          />

          <Input
            label="CNPJ"
            placeholder="00.000.000/0001-00"
            required
            error={errors.cnpj?.message}
            hint="Informe apenas números ou no formato com pontuação"
            {...register('cnpj')}
          />

          <ModalFooter>
            <Button variant="outline" size="sm" type="button" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              {editTarget ? 'Salvar Alterações' : 'Criar Cliente'}
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
        title="Excluir cliente?"
        message={`Deseja excluir "${deleteTarget?.razao_social}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  )
}
