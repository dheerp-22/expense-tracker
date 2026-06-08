import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { borrowApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Trash2, X, Check, ArrowDownCircle, ArrowUpCircle, CheckCircle2, HandCoins } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface SettleModalProps {
  tx: any
  onClose: () => void
  onSuccess: () => void
}

function SettleModal({ tx, onClose, onSuccess }: SettleModalProps) {
  const [amount, setAmount] = useState((tx.amount - tx.paid_amount).toString())
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSettle = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return }
    setLoading(true)
    try {
      await borrowApi.settle(tx.id, { amount: amt, date, notes })
      toast.success('Settlement recorded!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed')
    } finally { setLoading(false) }
  }

  const pending = tx.amount - tx.paid_amount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Record Settlement</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={16} /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          {tx.type === 'borrow' ? 'You repaying' : 'They returning'} to <strong>{tx.person_name}</strong>
          <br />Pending: <span className="font-mono font-bold text-rose-500">{formatCurrency(pending)}</span>
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">Settlement Amount (₹)</label>
            <input type="number" className="input font-mono" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <input type="text" className="input" placeholder="Optional..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSettle} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Check size={15} /> {loading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BorrowPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [settlingTx, setSettlingTx] = useState<any | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'borrow' | 'lend'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('all')
  const [form, setForm] = useState({ person_name: '', amount: '', type: 'borrow', date: format(new Date(), 'yyyy-MM-dd'), due_date: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const { data: transactions = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['borrow', typeFilter, statusFilter],
    queryFn: () => borrowApi.list({
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }).then(r => r.data),
  })

  const pendingBorrow = transactions.filter(t => t.type === 'borrow' && t.status !== 'settled').reduce((s, t) => s + parseFloat(t.amount) - parseFloat(t.paid_amount || 0), 0)
  const pendingLend = transactions.filter(t => t.type === 'lend' && t.status !== 'settled').reduce((s, t) => s + parseFloat(t.amount) - parseFloat(t.paid_amount || 0), 0)

  const resetForm = () => {
    setForm({ person_name: '', amount: '', type: 'borrow', date: format(new Date(), 'yyyy-MM-dd'), due_date: '', notes: '' })
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.person_name.trim() || !form.amount) { toast.error('Fill required fields'); return }
    setLoading(true)
    try {
      await borrowApi.create({ ...form, amount: parseFloat(form.amount) })
      toast.success('Added!')
      qc.invalidateQueries({ queryKey: ['borrow'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      resetForm()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    try {
      await borrowApi.delete(id)
      toast.success('Deleted')
      refetch()
    } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Borrow & Lend</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track money you borrowed or lent</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 border-l-4 border-rose-400">
          <div className="flex items-center gap-2 text-rose-500 mb-1">
            <ArrowDownCircle size={16} />
            <span className="text-xs font-medium uppercase tracking-wide">You Borrowed</span>
          </div>
          <p className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">{formatCurrency(pendingBorrow)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Pending repayment</p>
        </div>
        <div className="card p-4 border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <ArrowUpCircle size={16} />
            <span className="text-xs font-medium uppercase tracking-wide">You Lent</span>
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(pendingLend)}</p>
          <p className="text-xs text-slate-400 mt-0.5">To recover</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">New Entry</h3>
            <button onClick={resetForm} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Person Name *</label>
              <input type="text" className="input" placeholder="e.g. Rahul, Mom"
                value={form.person_name} onChange={e => setForm(f => ({ ...f, person_name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" className="input font-mono" placeholder="0.00"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="borrow">I Borrowed</option>
                <option value="lend">I Lent</option>
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input type="text" className="input" placeholder="Optional..."
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={resetForm} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
              <Check size={15} /> {loading ? 'Saving...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'borrow', 'lend'] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={cn('px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
              typeFilter === t ? 'bg-indigo-500 text-white' : 'btn-secondary')}>
            {t === 'all' ? 'All' : t === 'borrow' ? '↓ Borrowed' : '↑ Lent'}
          </button>
        ))}
        <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
        {(['all', 'pending', 'partial', 'settled'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s as any)}
            className={cn('px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
              statusFilter === s ? 'bg-indigo-500 text-white' : 'btn-secondary')}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <HandCoins size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No entries found</p>
            <p className="text-sm mt-1">Track money you borrow or lend to friends</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {transactions.map(tx => {
              const pending = parseFloat(tx.amount) - parseFloat(tx.paid_amount || 0)
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    tx.type === 'borrow' ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30')}>
                    {tx.type === 'borrow'
                      ? <ArrowDownCircle size={18} className="text-rose-500" />
                      : <ArrowUpCircle size={18} className="text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{tx.person_name}</p>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium',
                        tx.status === 'settled'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : tx.status === 'partial'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400')}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {tx.type === 'borrow' ? 'You borrowed' : 'You lent'} · {formatDate(tx.date)}
                      {tx.due_date && ` · Due ${formatDate(tx.due_date)}`}
                    </p>
                    {tx.status !== 'settled' && parseFloat(tx.paid_amount || 0) > 0 && (
                      <p className="text-xs text-indigo-500 mt-0.5">Paid: {formatCurrency(tx.paid_amount)} · Remaining: {formatCurrency(pending)}</p>
                    )}
                    {tx.notes && <p className="text-xs text-slate-400 mt-0.5">{tx.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={cn('text-sm font-mono font-bold', tx.type === 'borrow' ? 'text-rose-500' : 'text-emerald-500')}>
                        {formatCurrency(tx.amount)}
                      </p>
                      {tx.status !== 'settled' && pending < parseFloat(tx.amount) && (
                        <p className="text-xs text-slate-400 font-mono">{formatCurrency(pending)} left</p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {tx.status !== 'settled' && (
                        <button onClick={() => setSettlingTx(tx)} className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600 transition-colors" title="Record settlement">
                          <CheckCircle2 size={13} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {settlingTx && (
        <SettleModal
          tx={settlingTx}
          onClose={() => setSettlingTx(null)}
          onSuccess={() => {
            setSettlingTx(null)
            qc.invalidateQueries({ queryKey: ['borrow'] })
            qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
          }}
        />
      )}
    </div>
  )
}
