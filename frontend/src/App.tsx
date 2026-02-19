import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { AppLayout } from '@/components/layout/AppLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { ClientsPage } from '@/pages/clients/ClientsPage'
import { ContractsPage } from '@/pages/contracts/ContractsPage'
import { ProjectsPage } from '@/pages/projects/ProjectsPage'
import { CatalogPage } from '@/pages/catalog/CatalogPage'
import { OrdersPage } from '@/pages/orders/OrdersPage'
import { OrderCreatePage } from '@/pages/orders/OrderCreatePage'
import { OrderDetailPage } from '@/pages/orders/OrderDetailPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected (requires auth) */}
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/contratos" element={<ContractsPage />} />
            <Route path="/projetos" element={<ProjectsPage />} />
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/orcamentos" element={<OrdersPage />} />
            <Route path="/orcamentos/novo" element={<OrderCreatePage />} />
            <Route path="/orcamentos/:id" element={<OrderDetailPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '12px',
            boxShadow: '0 10px 40px -5px rgba(0,0,0,0.3)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  )
}
