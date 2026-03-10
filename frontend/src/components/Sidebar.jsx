import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Briefcase, Upload, Users,
  BarChart3, LogOut, Brain, ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs/new',   icon: Briefcase,       label: 'Create Job' },
  { to: '/analytics',  icon: BarChart3,       label: 'Analytics' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-none">TalentAI</h1>
            <p className="text-slate-500 text-xs mt-0.5">ATS Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive && 'active')
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            <ChevronRight size={14} className="ml-auto opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center">
            <span className="text-brand-300 text-sm font-bold">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.full_name || user?.email?.split('@')[0]}
            </p>
            <p className="text-slate-500 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
