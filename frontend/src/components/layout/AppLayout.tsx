import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header />

      {/* Main content area — offset for fixed sidebar + header */}
      <main className="ml-60 pt-16 min-h-screen">
        <div className="p-6 max-w-screen-xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
