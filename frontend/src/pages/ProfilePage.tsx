import { useState, FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, formatDate } from '@/lib/utils'
import { User, Mail, Calendar, Shield, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const AVATAR_COLORS = [
  '#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6',
  '#8b5cf6','#ef4444','#f97316','#06b6d4','#84cc16',
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    // Password change would call an API — showing as UI demo
    await new Promise(r => setTimeout(r, 800))
    toast.success('Password change feature coming soon!')
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your account information</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0"
            style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
          >
            {getInitials(user?.name || 'U')}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <User size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="text-sm font-medium mt-0.5">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <Mail size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium mt-0.5 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <Calendar size={16} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Member Since</p>
              <p className="text-sm font-medium mt-0.5">{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Color Picker */}
      <div className="card p-6">
        <h3 className="font-semibold text-sm mb-4">Avatar Color</h3>
        <div className="flex gap-3 flex-wrap">
          {AVATAR_COLORS.map(color => (
            <button
              key={color}
              className="w-10 h-10 rounded-xl transition-transform hover:scale-110 active:scale-95 ring-2 ring-offset-2 dark:ring-offset-slate-900"
              style={{
                backgroundColor: color,
                ringColor: user?.avatarColor === color ? color : 'transparent',
              }}
              title={color}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">Color change will be available in a future update</p>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-slate-400" />
          <h3 className="font-semibold text-sm">Change Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border border-rose-100 dark:border-rose-900/30">
        <h3 className="font-semibold text-sm text-rose-600 dark:text-rose-400 mb-3">Account Actions</h3>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
