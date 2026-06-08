import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/lib/api'
import { Category } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORY_ICONS = ['🍽️','🚗','🛍️','🏠','💡','🏥','🎬','📚','⛽','📱','🛒','💰','✈️','🎮','💄','👕','🐾','🌱','🎵','🍕','☕','🚌','🎁','💊']
const CATEGORY_COLORS = ['#6366f1','#ec4899','#f97316','#10b981','#3b82f6','#8b5cf6','#eab308','#ef4444','#06b6d4','#84cc16','#f59e0b','#14b8a6']

interface FormState {
  name: string; icon: string; color: string;
}

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ name: '', icon: '💰', color: '#6366f1' })
  const [loading, setLoading] = useState(false)

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then(r => r.data),
  })

  const resetForm = () => { setForm({ name: '', icon: '💰', color: '#6366f1' }); setEditId(null); setShowForm(false) }

  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, icon: cat.icon, color: cat.color })
    setEditId(cat.id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return }
    setLoading(true)
    try {
      if (editId) {
        await categoriesApi.update(editId, form)
        toast.success('Category updated!')
      } else {
        await categoriesApi.create(form)
        toast.success('Category created!')
      }
      qc.invalidateQueries({ queryKey: ['categories'] })
      resetForm()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Expenses in this category will become uncategorized.')) return
    try {
      await categoriesApi.delete(id)
      toast.success('Category deleted')
      qc.invalidateQueries({ queryKey: ['categories'] })
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Categories</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{categories.length} categories</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editId ? 'Edit Category' : 'New Category'}</h3>
            <button onClick={resetForm} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                placeholder="Category name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Icon</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {CATEGORY_ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setForm(f => ({ ...f, icon }))}
                    className={`w-9 h-9 rounded-lg text-lg transition-all ${form.icon === icon ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {CATEGORY_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setForm(f => ({ ...f, color }))}
                    className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                    style={{ backgroundColor: color, outline: form.color === color ? `3px solid ${color}` : 'none', outlineOffset: '2px' }}
                  />
                ))}
              </div>
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="card p-4 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: cat.color + '25' }}
                >
                  {cat.icon}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(cat)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="font-semibold text-sm truncate">{cat.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {formatCurrency(Number(cat.total_spent) || 0)} this month
              </p>
              {cat.is_default && (
                <span className="inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
