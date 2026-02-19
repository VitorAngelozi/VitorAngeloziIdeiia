import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-card border border-slate-200',
        'transition-shadow duration-200',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-5 py-4',
        'border-b border-slate-100',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-base font-semibold text-slate-800', className)}>
      {children}
    </h3>
  )
}

export function CardBody({ children, className, padding = 'md' }: CardBodyProps) {
  return (
    <div className={cn(paddingClasses[padding], className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        'px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl',
        className
      )}
    >
      {children}
    </div>
  )
}
