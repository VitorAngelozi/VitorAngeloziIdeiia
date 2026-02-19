import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

// Em produção (Render): usa VITE_API_URL se definida, senão a API no Render
// Em dev: usa localhost:8000
const BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? 'https://vitorangeloziideiia.onrender.com'
    : 'http://localhost:8000')

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor: inject Bearer token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('[AXIOS] Request config:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data,
    })
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg ?? JSON.stringify(d)).join(', ')
    }
    if (error.response?.data?.message) return error.response.data.message
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return 'Erro desconhecido'
}
