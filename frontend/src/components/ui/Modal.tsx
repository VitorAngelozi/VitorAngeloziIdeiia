import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  hideClose?: boolean
  className?: string
}

const sizeClasses = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-xl',
  '2xl': 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  hideClose = false,
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'animate-fade-in'
      )}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-modal',
          'flex flex-col max-h-[90vh]',
          'animate-slide-up',
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-slate-900 leading-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                className={cn(
                  'ml-4 shrink-0 p-1.5 rounded-lg text-slate-400',
                  'hover:text-slate-600 hover:bg-slate-100',
                  'transition-colors duration-150 focus:outline-none',
                  'focus:ring-2 focus:ring-brand-500'
                )}
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2',
        'mt-6 pt-4 border-t border-slate-100',
        className
      )}
    >
      {children}
    </div>
  )
}
