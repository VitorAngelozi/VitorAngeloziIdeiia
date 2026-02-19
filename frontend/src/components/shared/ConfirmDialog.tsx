import { AlertTriangle } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar? Esta ação não pode ser desfeita.',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" hideClose>
      <div className="flex flex-col items-center text-center gap-4">
        <div
          className={cn(
            'flex items-center justify-center w-14 h-14 rounded-full',
            variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'
          )}
        >
          <AlertTriangle
            className={cn(
              'w-7 h-7',
              variant === 'danger' ? 'text-red-500' : 'text-amber-500'
            )}
          />
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
      </div>

      <ModalFooter className="justify-center">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
