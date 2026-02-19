import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  BookOpen,
  Calculator,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    end: true,
  },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: <Users className="w-4 h-4" />,
  },
  {
    to: '/contratos',
    label: 'Contratos',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    to: '/projetos',
    label: 'Projetos',
    icon: <FolderOpen className="w-4 h-4" />,
  },
  {
    to: '/catalogo',
    label: 'Catálogo',
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    to: '/orcamentos',
    label: 'Orçamentos',
    icon: <Calculator className="w-4 h-4" />,
  },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-sidebar select-none">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 shadow-sm">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-white font-bold text-sm tracking-tight">UST Gestão</span>
          <span className="text-sidebar-text text-[10px] font-medium uppercase tracking-widest mt-0.5">
            Orçamentos
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Menu
        </p>

        {navItems.map((item) => {
          const isActive =
            item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={cn(
                'group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-blue-200 shrink-0" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-hover">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <span className="text-xs text-sidebar-text truncate">API conectada</span>
        </div>
      </div>
    </aside>
  )
}
