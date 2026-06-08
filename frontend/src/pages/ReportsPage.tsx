import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'
import { formatCurrency, CHART_COLORS } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { BarChart3, Download } from 'lucide-react'

const PRESETS = [
  { label: 'This Month', start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'Last Month', start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'), end: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd') },
  { label: 'Last 3 Months', start: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'Last 6 Months', start: format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'This Year', start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-mono">{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function ReportsPage() {
  const [preset, setPreset] = useState(0)
  const [startDate, setStartDate] = useState(PRESETS[0].start)
  const [endDate, setEndDate] = useState(PRESETS[0].end)
  const [customMode, setCustomMode] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['reports', startDate, endDate],
    queryFn: () => dashboardApi.reports({ startDate, endDate }).then(r => r.data),
  })

  const selectPreset = (i: number) => {
    setPreset(i)
    setStartDate(PRESETS[i].start)
    setEndDate(PRESETS[i].end)
    setCustomMode(false)
  }

  const byCategory = data?.byCategory || []
  const byAccount = data?.byAccount || []
  const byMonth = data?.byMonth || []

  const totalExpense = byCategory.reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0)

  const exportCSV = () => {
    if (!byCategory.length) return
    const rows = [['Category', 'Total', 'Count'], ...byCategory.map((c: any) => [c.name, c.total, c.count])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `report-${startDate}-${endDate}.csv`; a.click()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Analyze your spending patterns</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => selectPreset(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                !customMode && preset === i
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setCustomMode(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              customMode ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Custom
          </button>
        </div>
        {customMode && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">From</label>
              <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">To</label>
              <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="card p-5 col-span-2 sm:col-span-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Spent</p>
              <p className="text-3xl font-extrabold font-mono mt-1.5 text-rose-500">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Categories Used</p>
              <p className="text-3xl font-extrabold font-mono mt-1.5">{byCategory.length}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Accounts Used</p>
              <p className="text-3xl font-extrabold font-mono mt-1.5">{byAccount.length}</p>
            </div>
          </div>

          {/* Monthly Trend */}
          {byMonth.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-4">Monthly Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byMonth} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="expense" name="Expense" fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Pie */}
            {byCategory.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-sm mb-4">Category Breakdown</h3>
                <div className="flex gap-4 items-start">
                  <ResponsiveContainer width={150} height={150}>
                    <PieChart>
                      <Pie data={byCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="total" paddingAngle={2}>
                        {byCategory.map((_: any, idx: number) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 min-w-0 max-h-36 overflow-y-auto">
                    {byCategory.map((cat: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-sm">{cat.icon}</span>
                        <span className="truncate text-slate-600 dark:text-slate-300">{cat.name}</span>
                        <span className="ml-auto font-mono font-semibold whitespace-nowrap">{formatCurrency(cat.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Account Breakdown */}
            {byAccount.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-sm mb-4">Spending by Account</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={byAccount} layout="vertical" barSize={16}>
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Spent" fill="#6366f1" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category Table */}
          {byCategory.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-sm">Category Details</h3>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {byCategory.map((cat: any, i: number) => {
                  const pct = totalExpense > 0 ? ((parseFloat(cat.total) / totalExpense) * 100).toFixed(1) : '0'
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: (CHART_COLORS[i % CHART_COLORS.length]) + '20' }}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{cat.name}</p>
                          <p className="text-sm font-mono font-bold">{formatCurrency(cat.total)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {byCategory.length === 0 && byMonth.length === 0 && (
            <div className="card p-12 text-center text-slate-400">
              <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No data for selected period</p>
              <p className="text-sm mt-1">Try a different date range</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
