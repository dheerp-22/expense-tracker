import { useState, FormEvent, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { expensesApi, categoriesApi, accountsApi } from '@/lib/api'
import { Category, Account, Expense } from '@/types'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Props {
  onClose: () => void
  onSuccess: () => void
  expense?: Expense | null
}

export default function AddExpenseModal({ onClose, onSuccess, expense }: Props) {
  const qc = useQueryClient()
  const [title, setTitle] = useState(expense?.title || '')
  const [amount, setAmount] = useState(expense?.amount?.toString() || '')
  const [date, setDate] = useState(expense?.date || format(new Date(), 'yyyy-MM-dd'))
  const [categoryId, setCategoryId] = useState(expense?.category_id || '')
  const [accountId, setAccountId] = useState(expense?.account_id || '')
  const [notes, setNotes] = useState(expense?.notes || '')
  const [loading, setLoading] = useState(false)

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then(r => r.data),
  })

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list().then(r => r.data),
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount || !date) {
      toast.error('Please fill required fields')
      return
    }
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        amount: amountNum,
        date,
        category_id: categoryId || undefined,
        account_id: accountId || undefined,
        notes: notes.trim() || undefined,
      }

      if (expense) {
        await expensesApi.update(expense.id, payload)
        toast.success('Expense updated!')
      } else {
        await expensesApi.create(payload)
        toast.success('Expense added!')
      }
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Lunch, Petrol, Groceries"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input font-mono"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">No category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Account</label>
              <select
                className="input"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
              >
                <option value="">No account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none h-16"
              placeholder="Optional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : expense ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
