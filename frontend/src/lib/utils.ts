import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isToday, isYesterday } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = '₹'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return `${currency}0`
  return `${currency}${Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'd MMM yyyy')
  } catch { return dateStr }
}

export function formatShortDate(dateStr: string): string {
  try { return format(parseISO(dateStr), 'd MMM') } catch { return dateStr }
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bank: 'Bank Account', cash: 'Cash', upi: 'UPI Wallet', credit_card: 'Credit Card', other: 'Other',
}

export const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  bank: '🏦', cash: '💵', upi: '📱', credit_card: '💳', other: '💰',
}

export const CHART_COLORS = [
  '#6366f1','#f97316','#10b981','#ec4899','#3b82f6',
  '#eab308','#ef4444','#8b5cf6','#06b6d4','#84cc16',
  '#f59e0b','#14b8a6',
]
