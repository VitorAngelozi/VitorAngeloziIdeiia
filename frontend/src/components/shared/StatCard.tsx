import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: ReactNode
  iconColor?: string
  iconBg?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon,
  iconColor = 'text-brand-600',
  iconBg = 'bg-brand-50',
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-card p-5',
        'hover:shadow-card-hover transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 truncate">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 leading-none tracking-tight">
            {value}
          </p>
          {description && (
            <p className="mt-1.5 text-xs text-slate-500 truncate">{description}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  trend.positive !== false ? 'text-emerald-600' : 'text-red-500'
                )}
              >
                {trend.positive !== false ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {trend.value}%
              </span>
              <span className="text-xs text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'shrink-0 flex items-center justify-center w-12 h-12 rounded-xl',
            iconBg
          )}
        >
          <div className={cn('w-6 h-6', iconColor)}>{icon}</div>
        </div>
      </div>
    </div>
  )
}
