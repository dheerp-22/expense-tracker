import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'
import { formatCurrency, formatDate, CHART_COLORS } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, Receipt, Plus, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import AddExpenseModal from '@/components/expenses/AddExpenseModal'
import { useState } from 'react'

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: any; color: string; sub?: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-extrabold mt-1.5 tracking-tight font-mono">{value}</p>
          {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-indigo-500 font-mono">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [showAddExpense, setShowAddExpense] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.summary().then(r => r.data),
  })

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-24 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
        ))}
      </div>
    </div>
  )

  // Backend returns: { totals, categoryBreakdown, monthlyTrend, accounts, borrowSummary, recentExpenses }
  const totals = data?.totals || {}
  const categoryBreakdown = data?.categoryBreakdown || []
  const monthlyTrend = data?.monthlyTrend || []
  const accounts = data?.accounts || []
  const borrowSummary = data?.borrowSummary || {}
  const recentExpenses = data?.recentExpenses || []

  const totalBalance = accounts.reduce((sum: number, a: any) => sum + parseFloat(a.balance || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Here's your financial overview</p>
        </div>
        <button onClick={() => setShowAddExpense(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Expense</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="This Month" value={formatCurrency(totals.total_expense || 0)} icon={Receipt} color="#6366f1" sub="Expenses" />
        <StatCard label="Total Balance" value={formatCurrency(totalBalance)} icon={Wallet} color="#10b981" sub={`${accounts.length} accounts`} />
        <StatCard label="You Owe" value={formatCurrency(borrowSummary.you_owe || 0)} icon={ArrowDownCircle} color="#ef4444" sub="Pending" />
        <StatCard label="Owed to You" value={formatCurrency(borrowSummary.owed_to_you || 0)} icon={ArrowUpCircle} color="#f97316" sub="To recover" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">Spending by Category</h3>
          {categoryBreakdown.length > 0 ? (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="total" paddingAngle={2}>
                    {categoryBreakdown.map((cat: any, idx: number) => (
                      <Cell key={idx} fill={cat.color || CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 min-w-0">
                {categoryBreakdown.slice(0, 6).map((cat: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || CHART_COLORS[i] }} />
                    <span className="truncate text-slate-600 dark:text-slate-300">{cat.icon} {cat.name}</span>
                    <span className="ml-auto font-mono font-semibold">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 text-slate-400">
              <Receipt size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No expenses this month</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4">Monthly Trend</h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyTrend} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="expense" name="Expense" fill="#6366f1" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 text-slate-400">
              <TrendingUp size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Account Balances */}
      {accounts.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Account Balances</h3>
            <Link to="/accounts" className="flex items-center gap-1 text-xs text-indigo-500 hover:underline font-medium">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {accounts.map((acc: any) => (
              <div key={acc.id} className="rounded-xl p-3.5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{acc.icon}</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{acc.name}</span>
                </div>
                <p className="font-mono font-bold text-sm" style={{ color: parseFloat(acc.balance) >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(acc.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Recent Expenses</h3>
          <Link to="/expenses" className="flex items-center gap-1 text-xs text-indigo-500 hover:underline font-medium">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {recentExpenses.length > 0 ? (
          <div className="space-y-1">
            {recentExpenses.map((exp: any) => (
              <div key={exp.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: (exp.category_color || '#6366f1') + '20' }}>
                  {exp.category_icon || '💰'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exp.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{exp.category_name || 'Uncategorized'} · {formatDate(exp.date)}</p>
                </div>
                <p className="amount-negative text-sm">{formatCurrency(exp.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Receipt size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No expenses yet. Add your first one!</p>
          </div>
        )}
      </div>

      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onSuccess={() => { setShowAddExpense(false); refetch() }}
        />
      )}
    </div>
  )
}
