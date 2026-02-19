import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-slate-100 text-slate-700 ring-slate-200',
  success:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning:  'bg-amber-50 text-amber-700 ring-amber-200',
  danger:   'bg-red-50 text-red-700 ring-red-200',
  info:     'bg-blue-50 text-blue-700 ring-blue-200',
  purple:   'bg-purple-50 text-purple-700 ring-purple-200',
  outline:  'bg-white text-slate-600 ring-slate-300',
}

const dotClasses: Record<BadgeVariant, string> = {
  default:  'bg-slate-500',
  success:  'bg-emerald-500',
  warning:  'bg-amber-500',
  danger:   'bg-red-500',
  info:     'bg-blue-500',
  purple:   'bg-purple-500',
  outline:  'bg-slate-400',
}

export function Badge({ variant = 'default', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotClasses[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}

// Helper: derive badge variant from orçamento status
export function statusOrcamentoBadge(status: string): BadgeVariant {
  switch (status) {
    case 'Aprovado': return 'success'
    case 'Rascunho': return 'warning'
    default:          return 'default'
  }
}

// Helper: derive badge variant from contract/project status
export function statusGenericBadge(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'ativo':   return 'success'
    case 'inativo': return 'danger'
    default:        return 'default'
  }
}

// Helper: catalog tipo badge
export function tipoCatalogoBadge(tipo: string): BadgeVariant {
  switch (tipo) {
    case 'CICLO':      return 'info'
    case 'FASE':       return 'purple'
    case 'ATIVIDADE':  return 'warning'
    default:           return 'default'
  }
}
