import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-slate-200 border-t-brand-600',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Carregando..."
    />
  )
}

interface LoadingOverlayProps {
  text?: string
}

export function LoadingOverlay({ text = 'Carregando...' }: LoadingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Spinner size="lg" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
