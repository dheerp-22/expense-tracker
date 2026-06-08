import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/lib/api'
import { formatCurrency, ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS } from '@/lib/utils'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1', '#ec4899', '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#eab308', '#ef4444', '#06b6d4', '#22c55e']

export default function AccountsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'bank', balance: '', icon: '🏦', color: '#3b82f6' })
  const [loading, setLoading] = useState(false)

  const { data: accounts = [], isLoading } = useQuery<any[]>({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list().then(r => r.data),
  })

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0)

  const resetForm = () => {
    setForm({ name: '', type: 'bank', balance: '', icon: '🏦', color: '#3b82f6' })
    setEditId(null); setShowForm(false)
  }

  const handleEdit = (acc: any) => {
    console.log("handleEdit called");

    setForm({
      name: acc.name,
      type: acc.type,
      balance: acc.balance?.toString() || '',
      icon: acc.icon,
      color: acc.color
    });

    setEditId(acc.id);
    setShowForm(true);

    console.log("showForm set");
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return }
    setLoading(true)
    try {
      const payload = { ...form, balance: parseFloat(form.balance) || 0 }
      if (editId) {
        await accountsApi.update(editId, payload)
        toast.success('Account updated!')
      } else {
        await accountsApi.create(payload)
        toast.success('Account created!')
      }
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      resetForm()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this account?')) return
    try {
      await accountsApi.delete(id)
      toast.success('Account deleted')
      qc.invalidateQueries({ queryKey: ['accounts'] })
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Accounts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Total balance: <span className="font-mono font-bold text-emerald-500">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      {showForm && (
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editId ? 'Edit Account' : 'New Account'}</h3>
            <button onClick={resetForm} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Account Name</label>
              <input type="text" className="input" placeholder="e.g. HDFC, Cash, PhonePe"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value, icon: ACCOUNT_TYPE_ICONS[e.target.value] || '💰' }))}>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Balance (₹)</label>
              <input type="number" className="input font-mono" placeholder="0.00"
                value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-lg transition-all hover:scale-110"
                  style={{ backgroundColor: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={resetForm} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
              <Check size={15} /> {loading ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800/50" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-3xl mb-3">🏦</p>
          <p className="font-medium">No accounts yet</p>
          <p className="text-sm mt-1">Add your bank accounts, cash wallet, or UPI apps</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="card p-5 group relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 pointer-events-none"
                style={{ backgroundColor: acc.color }}
              />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: acc.color + '20' }}>
                    {acc.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{acc.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{ACCOUNT_TYPE_LABELS[acc.type] || acc.type}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-50">
                  <button onClick={() => handleEdit(acc)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-2xl font-extrabold font-mono tracking-tight" style={{ color: parseFloat(acc.balance) >= 0 ? '#10b981' : '#ef4444' }}>
                {formatCurrency(parseFloat(acc.balance))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
