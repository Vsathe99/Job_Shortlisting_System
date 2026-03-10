import { useState, useEffect } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Star, XCircle, BarChart3 } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const PALETTE = ['#6272f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

const CustomTooltip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="bg-dark-700 border border-white/10 rounded-xl p-3 text-sm">
      <p className="text-white font-medium mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  ) : null

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return null

  const stats = [
    { icon: Users,     label: 'Total Resumes',  value: data.total_resumes,     color: 'text-brand-400',   bg: 'bg-brand-600/10' },
    { icon: Star,      label: 'Shortlisted',    value: data.total_shortlisted, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
    { icon: TrendingUp,label: 'Selected',       value: data.total_selected,    color: 'text-violet-400',  bg: 'bg-violet-600/10' },
    { icon: XCircle,   label: 'Rejected',       value: data.total_rejected,    color: 'text-red-400',     bg: 'bg-red-600/10' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="text-slate-400 mt-1">Recruitment insights and candidate distribution</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <motion.div whileHover={{ scale: 1.02 }} key={label} className="stat-card glow-hover transition-all">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Average score */}
      <div className="glass-card p-5 flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-600/20 flex items-center justify-center flex-shrink-0">
          <BarChart3 size={28} className="text-brand-400" />
        </div>
        <div className="flex-1">
          <p className="text-slate-400 text-sm mb-1">Average Candidate Score</p>
          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold text-white">{Math.round((data.average_score || 0) * 100)}%</p>
            <div className="flex-1 h-3 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-600 to-violet-500 rounded-full score-bar"
                style={{ width: `${Math.round((data.average_score || 0) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top skills */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="section-title mb-5">Top Skills Distribution</h2>
          {data.top_skills.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.top_skills.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232845" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis type="category" dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {data.top_skills.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Candidate status pie */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6">
          <h2 className="section-title mb-5">Candidates by Status</h2>
          {data.candidates_by_status.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.candidates_by_status}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#4f57e4' }}
                >
                  {data.candidates_by_status.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Score distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h2 className="section-title mb-5">Score Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.score_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232845" />
              <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.score_distribution.map((_, i) => (
                  <Cell key={i} fill={['#ef4444', '#f59e0b', '#6272f1', '#10b981'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Jobs distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
          <h2 className="section-title mb-5">Candidates per Job</h2>
          {data.candidates_by_job.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.candidates_by_job}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232845" />
                <XAxis dataKey="job" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6272f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  )
}
