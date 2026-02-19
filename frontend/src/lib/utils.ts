import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  const num = Number(value)
  if (isNaN(num)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDecimal(value: number | string | null | undefined, decimals = 4): string {
  if (value === null || value === undefined) return '0'
  const num = Number(value)
  if (isNaN(num)) return '0'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  } catch {
    return value
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    const date = new Date(value)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return value
  }
}

export function toISODate(value: string | null | undefined): string {
  if (!value) return ''
  // already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return value
}

export function parseNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const n = Number(value)
  return isNaN(n) ? 0 : n
}

export function calcularItemOrcamento(
  horasEstimadas: number,
  complexidadeUst: number,
  valorUst: number
): { subtotalUst: number; subtotalBruto: number } {
  const subtotalUst = complexidadeUst * horasEstimadas
  const subtotalBruto = subtotalUst * valorUst
  return {
    subtotalUst: Math.round(subtotalUst * 10000) / 10000,
    subtotalBruto: Math.round(subtotalBruto * 10000) / 10000,
  }
}

export function calcularTotaisOrcamento(
  itens: Array<{ subtotalBruto: number }>,
  descontoPercentual: number
): { valorTotalBruto: number; valorDesconto: number; valorTotalLiquido: number } {
  const valorTotalBruto = itens.reduce((acc, i) => acc + i.subtotalBruto, 0)
  const valorDesconto = valorTotalBruto * (descontoPercentual / 100)
  const valorTotalLiquido = valorTotalBruto - valorDesconto
  return {
    valorTotalBruto: Math.round(valorTotalBruto * 10000) / 10000,
    valorDesconto: Math.round(valorDesconto * 10000) / 10000,
    valorTotalLiquido: Math.round(valorTotalLiquido * 10000) / 10000,
  }
}

export function truncate(str: string, max = 40): string {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}
