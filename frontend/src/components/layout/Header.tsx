import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, ChevronDown, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

export function Header() {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = usuario?.username
    ? usuario.username.slice(0, 2).toUpperCase()
    : '??'

  return (
    <header className="fixed top-0 left-60 right-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left — breadcrumb placeholder kept minimal */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="font-semibold text-slate-700">UST Gestão</span>
      </div>

      {/* Right — user menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            'flex items-center gap-2.5 px-3 py-1.5 rounded-lg',
            'text-sm font-medium text-slate-700',
            'hover:bg-slate-100 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
            menuOpen && 'bg-slate-100'
          )}
        >
          {/* Avatar */}
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold shrink-0">
            {initials}
          </div>

          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-slate-800 font-semibold text-sm">
              {usuario?.username ?? 'Usuário'}
            </span>
            {usuario?.admin === 1 && (
              <span className="text-[10px] text-brand-600 font-medium mt-0.5 flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" />
                Admin
              </span>
            )}
          </div>

          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-slate-400 transition-transform duration-150',
              menuOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-modal border border-slate-200 py-1.5 z-50 animate-slide-up">
            {/* User info */}
            <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {usuario?.username}
              </p>
              {usuario?.email && (
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {usuario.email}
                </p>
              )}
              {usuario?.admin === 1 && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold uppercase tracking-wide bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                  <Shield className="w-2.5 h-2.5" />
                  Administrador
                </span>
              )}
            </div>

            {/* Profile item */}
            <button
              onClick={() => {
                setMenuOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-100"
            >
              <User className="w-4 h-4 text-slate-400" />
              Meu perfil
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-slate-100" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-100"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
