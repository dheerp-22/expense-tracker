import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { expensesApi, categoriesApi, accountsApi } from '@/lib/api'
import { Expense, Category, Account } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Filter, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import AddExpenseModal from '@/components/expenses/AddExpenseModal'

export default function ExpensesPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then(r => r.data),
  })
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list().then(r => r.data),
  })
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['expenses', page, search, categoryFilter, accountFilter, startDate, endDate],
    queryFn: () => expensesApi.list({
      page,
      limit: 20,
      search: search || undefined,
      category_id: categoryFilter || undefined,
      account_id: accountFilter || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }).then(r => r.data),
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    try {
      await expensesApi.delete(id)
      toast.success('Expense deleted')
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
    } catch {
      toast.error('Failed to delete')
    }
  }

  const expenses: Expense[] = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {pagination?.total || 0} total entries
          </p>
        </div>
        <button onClick={() => { setEditExpense(null); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search expenses..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select className="input text-sm" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select className="input text-sm" value={accountFilter} onChange={e => { setAccountFilter(e.target.value); setPage(1) }}>
            <option value="">All accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
          </select>
          <input type="date" className="input text-sm" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }} placeholder="From" />
          <input type="date" className="input text-sm" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }} placeholder="To" />
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-3xl mb-3">💸</p>
            <p className="font-medium">No expenses found</p>
            <p className="text-sm mt-1">Add your first expense to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {expenses.map(exp => (
              <div key={exp.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: (exp.category_color || '#6366f1') + '20' }}
                >
                  {exp.category_icon || '💰'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{exp.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {exp.category_name || 'Uncategorized'}
                    {exp.account_name && ` · ${exp.account_icon} ${exp.account_name}`}
                    {' · '}{formatDate(exp.date)}
                  </p>
                  {exp.notes && <p className="text-xs text-slate-400 truncate mt-0.5">{exp.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <p className="amount-negative text-sm font-mono">{formatCurrency(exp.amount)}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditExpense(exp); setShowModal(true) }}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <AddExpenseModal
          expense={editExpense}
          onClose={() => { setShowModal(false); setEditExpense(null) }}
          onSuccess={() => { setShowModal(false); setEditExpense(null); refetch() }}
        />
      )}
    </div>
  )
}
