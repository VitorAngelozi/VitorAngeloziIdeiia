import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

interface TableHeadProps {
  children: ReactNode
  className?: string
}

interface TableBodyProps {
  children: ReactNode
  className?: string
}

interface TableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  clickable?: boolean
}

interface TableCellProps {
  children?: ReactNode
  className?: string
  colSpan?: number
  align?: 'left' | 'center' | 'right'
}

interface TableHeaderCellProps {
  children?: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-slate-200', className)}>
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  )
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <thead className={cn('bg-slate-50 border-b border-slate-200', className)}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn('divide-y divide-slate-100 bg-white', className)}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className, onClick, clickable }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-100',
        (clickable || onClick) && 'cursor-pointer hover:bg-slate-50/80',
        className
      )}
    >
      {children}
    </tr>
  )
}

export function TableHeaderCell({
  children,
  className,
  align = 'left',
}: TableHeaderCellProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap',
        alignClasses[align],
        className
      )}
    >
      {children}
    </th>
  )
}

export function TableCell({
  children,
  className,
  colSpan,
  align = 'left',
}: TableCellProps) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'px-4 py-3 text-slate-700 whitespace-nowrap',
        alignClasses[align],
        className
      )}
    >
      {children}
    </td>
  )
}

interface TableEmptyProps {
  colSpan: number
  message?: string
  icon?: ReactNode
}

export function TableEmpty({
  colSpan,
  message = 'Nenhum registro encontrado.',
  icon,
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
          {icon && <div className="text-slate-300">{icon}</div>}
          <p className="text-sm">{message}</p>
        </div>
      </td>
    </tr>
  )
}
