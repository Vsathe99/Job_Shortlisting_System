import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { motion } from 'framer-motion'
import { Briefcase, Users, Upload, Plus, ChevronRight, Clock, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../components/Badges'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/jobs'), api.get('/analytics')])
      .then(([jobsRes, analyticsRes]) => {
        setJobs(jobsRes.data)
        setAnalytics(analyticsRes.data)
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { icon: Briefcase, label: 'Active Jobs',    value: jobs.length,                       color: 'text-brand-400',   bg: 'bg-brand-600/10' },
    { icon: Users,     label: 'Total Resumes',  value: analytics?.total_resumes ?? 0,     color: 'text-violet-400',  bg: 'bg-violet-600/10' },
    { icon: TrendingUp,label: 'Shortlisted',    value: analytics?.total_shortlisted ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
    { icon: Clock,     label: 'Avg Score',      value: analytics ? `${Math.round((analytics.average_score || 0) * 100)}%` : '—', color: 'text-amber-400', bg: 'bg-amber-600/10' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Recruiter Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {user?.full_name || user?.email?.split('@')[0]} 👋
          </p>
        </div>
        <Link to="/jobs/new" className="brand-btn">
          <Plus size={18} />
          New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.02 }}
            className="stat-card glow-hover transition-all duration-200"
          >
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">{label}</p>
              <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Jobs list */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Your Job Postings</h2>
          <Link to="/jobs/new" className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1">
            <Plus size={14} /> Create job
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No job postings yet</p>
            <Link to="/jobs/new" className="brand-btn mt-4 inline-flex">
              <Plus size={16} /> Create your first job
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl border border-white/5 hover:border-brand-500/20 transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/jobs/${job.id}/candidates`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center">
                    <Briefcase size={18} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{job.title}</p>
                    <p className="text-slate-400 text-sm">
                      {job.candidate_count} candidates · {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 flex-wrap max-w-xs">
                    {(job.required_skills || []).slice(0, 3).map(skill => (
                      <span key={skill} className="badge bg-brand-600/10 text-brand-400 border border-brand-500/20">
                        {skill}
                      </span>
                    ))}
                    {(job.required_skills?.length || 0) > 3 && (
                      <span className="badge bg-dark-600 text-slate-400">+{job.required_skills.length - 3}</span>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}/upload`) }}
                      className="outline-btn text-xs px-3 py-1.5"
                    >
                      <Upload size={13} /> Upload
                    </button>
                    <ChevronRight size={16} className="text-slate-600 self-center" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
