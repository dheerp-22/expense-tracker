export interface User {
  id: string
  name: string
  email: string
  avatarColor: string
  createdAt?: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  is_default: boolean
  expense_count?: number
  total_spent?: number
}

export interface Account {
  id: string
  name: string
  account_type: 'bank' | 'cash' | 'upi' | 'credit_card' | 'other'
  balance: number
  icon: string
  color: string
  is_default: boolean
  expense_count?: number
  monthly_spent?: number
}

export interface Expense {
  id: string
  title: string
  amount: number
  date: string
  notes?: string
  category_id?: string
  category_name?: string
  category_icon?: string
  category_color?: string
  account_id?: string
  account_name?: string
  account_icon?: string
  created_at: string
}

export interface BorrowTransaction {
  id: string
  person_name: string
  amount: number
  type: 'borrow' | 'lend'
  status: 'pending' | 'settled' | 'partial'
  settled_amount: number
  date: string
  due_date?: string
  notes?: string
  created_at: string
}

export interface DashboardSummary {
  expenseSummary: { total: number; count: number }
  accountSummary: { total_balance: number; account_count: number }
  borrowSummary: { borrowed_pending: number; lent_pending: number }
  recentExpenses: Expense[]
  categoryBreakdown: { name: string; icon: string; color: string; total: number; count: number }[]
  monthlyTrend: { month_label: string; total: number; count: number }[]
}

export interface ReportData {
  totals: { total: number; count: number; avg_amount: number; max_amount: number }
  categoryBreakdown: { name: string; icon: string; color: string; total: number; count: number }[]
  accountBreakdown: { name: string; icon: string; account_type: string; total_spent: number; count: number }[]
  dailyTrend: { date: string; total: number; count: number }[]
  dateRange: { startDate: string; endDate: string }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}
