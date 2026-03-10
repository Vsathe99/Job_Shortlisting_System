import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, Filter, Search, Upload,
  ChevronRight, CheckSquare, Star, Trash2, X
} from 'lucide-react'
import { StatusBadge, CategoryBadge, ScoreBar } from '../components/Badges'

export default function CandidateRanking() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', min_score: '', max_score: '', skill: '' })
  const [showFilters, setShowFilters] = useState(false)

  const fetchCandidates = async (f = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ job_id: jobId })
      if (f.status) params.set('status', f.status)
      if (f.min_score) params.set('min_score', (Number(f.min_score) / 100).toString())
      if (f.max_score) params.set('max_score', (Number(f.max_score) / 100).toString())
      if (f.skill) params.set('skill', f.skill)
      const [jobRes, candRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/candidates?${params}`)
      ])
      setJob(jobRes.data)
      setCandidates(candRes.data)
    } catch { toast.error('Failed to load candidates') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCandidates() }, [jobId])

  const action = async (id, type) => {
    try {
      await api.post(`/candidates/${id}/${type}`)
      toast.success(`Candidate ${type}ed`)
      fetchCandidates()
    } catch { toast.error('Action failed') }
  }

  const deleteCandidate = async (id) => {
    if (!window.confirm('Delete this candidate and resume permanently?')) return
    try {
      await api.delete(`/candidates/${id}`)
      toast.success('Candidate deleted')
      setCandidates(prev => prev.filter(c => c.id !== id))
    } catch { toast.error('Delete failed') }
  }

  const applyFilters = () => fetchCandidates(filters)
  const clearFilters = () => {
    const reset = { status: '', min_score: '', max_score: '', skill: '' }
    setFilters(reset)
    fetchCandidates(reset)
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="page-title">Candidate Rankings</h1>
          {job && <p className="text-slate-400 text-sm mt-0.5">{job.title} · {candidates.length} candidates</p>}
        </div>
        <button
          onClick={() => navigate(`/jobs/${jobId}/upload`)}
          className="outline-btn"
        >
          <Upload size={16} /> Upload More
        </button>
        <button
          onClick={() => setShowFilters(p => !p)}
          className={`outline-btn ${activeFilterCount > 0 ? 'bg-brand-600/20 border-brand-500' : ''}`}
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center ml-1">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 mb-5 grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div>
            <label className="label">Status</label>
            <select value={filters.status} onChange={e => setFilters(p => ({...p, status: e.target.value}))}
              className="input-field">
              <option value="">All</option>
              <option value="new">New</option>
              <option value="selected">Selected</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="label">Min Score (%)</label>
            <input type="number" min="0" max="100" value={filters.min_score}
              onChange={e => setFilters(p => ({...p, min_score: e.target.value}))}
              className="input-field" placeholder="0" />
          </div>
          <div>
            <label className="label">Max Score (%)</label>
            <input type="number" min="0" max="100" value={filters.max_score}
              onChange={e => setFilters(p => ({...p, max_score: e.target.value}))}
              className="input-field" placeholder="100" />
          </div>
          <div>
            <label className="label">Skill</label>
            <input type="text" value={filters.skill}
              onChange={e => setFilters(p => ({...p, skill: e.target.value}))}
              className="input-field" placeholder="e.g. Python" />
          </div>
          <div className="col-span-2 lg:col-span-4 flex gap-2 justify-end">
            <button onClick={clearFilters} className="outline-btn"><X size={14} /> Clear</button>
            <button onClick={applyFilters} className="brand-btn"><Search size={14} /> Apply</button>
          </div>
        </motion.div>
      )}

      {/* Candidate table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No candidates yet</p>
            <p className="text-slate-500 text-sm mt-1">Upload resumes to get AI-powered rankings</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-4">#</th>
                <th className="text-left text-slate-400 text-xs font-medium px-2 py-4">Candidate</th>
                <th className="text-left text-slate-400 text-xs font-medium px-2 py-4">AI Score</th>
                <th className="text-left text-slate-400 text-xs font-medium px-2 py-4">Category</th>
                <th className="text-left text-slate-400 text-xs font-medium px-2 py-4">Status</th>
                <th className="text-left text-slate-400 text-xs font-medium px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/2 transition-colors group"
                >
                  <td className="px-6 py-4 text-slate-500 text-sm font-mono">{i + 1}</td>
                  <td className="px-2 py-4">
                    <div>
                      <p className="text-white font-medium">{c.name || 'Unknown'}</p>
                      <p className="text-slate-500 text-xs">{c.email || '—'}</p>
                    </div>
                  </td>
                  <td className="px-2 py-4 w-36">
                    <ScoreBar score={c.final_score} />
                  </td>
                  <td className="px-2 py-4">
                    <CategoryBadge category={c.shortlist_category} />
                  </td>
                  <td className="px-2 py-4">
                    <StatusBadge status={c.candidate_status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        className="p-1.5 rounded-lg hover:bg-brand-600/20 text-slate-400 hover:text-brand-400 transition-colors"
                        title="View profile"
                      >
                        <ChevronRight size={16} />
                      </button>
                      {c.candidate_status !== 'selected' ? (
                        <button onClick={() => action(c.id, 'select')}
                          className="p-1.5 rounded-lg hover:bg-brand-600/20 text-slate-400 hover:text-brand-400 transition-colors"
                          title="Select">
                          <CheckSquare size={16} />
                        </button>
                      ) : (
                        <button onClick={() => action(c.id, 'unselect')}
                          className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-400 transition-colors"
                          title="Unselect">
                          <CheckSquare size={16} />
                        </button>
                      )}
                      <button onClick={() => action(c.id, 'shortlist')}
                        className="p-1.5 rounded-lg hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Shortlist">
                        <Star size={16} />
                      </button>
                      <button onClick={() => deleteCandidate(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
