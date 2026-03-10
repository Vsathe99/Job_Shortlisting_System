import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import api from '../api/client'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  ArrowLeft, User, Mail, Phone, Briefcase, GraduationCap,
  Award, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  FileText, Star, CheckSquare, Trash2, TrendingUp
} from 'lucide-react'
import { StatusBadge, CategoryBadge, ScoreBar } from '../components/Badges'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

export default function CandidateProfile() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    api.get(`/candidates/${candidateId}`)
      .then(r => setCandidate(r.data))
      .catch(() => toast.error('Candidate not found'))
      .finally(() => setLoading(false))
  }, [candidateId])

  const action = async (type) => {
    try {
      await api.post(`/candidates/${candidateId}/${type}`)
      toast.success(`Candidate ${type}ed`)
      setCandidate(prev => ({
        ...prev,
        candidate_status: type === 'unselect' ? 'new' : type === 'shortlist' ? 'shortlisted' : type
      }))
    } catch { toast.error('Action failed') }
  }

  const deleteCandidate = async () => {
    if (!window.confirm('Delete this candidate permanently?')) return
    try {
      await api.delete(`/candidates/${candidateId}`)
      toast.success('Deleted')
      navigate(-1)
    } catch { toast.error('Delete failed') }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!candidate) return null

  const resumeUrl = `/resumes/${candidateId}/file`

  const isPdf = candidate.resume_path?.endsWith('.pdf')

  const ScoreCard = ({ label, value, icon: Icon }) => (
    <div className="p-4 bg-dark-700/50 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-slate-400" />
        <span className="text-slate-400 text-xs">{label}</span>
      </div>
      <ScoreBar score={value} />
    </div>
  )

  const TABS = ['profile', 'resume']

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{candidate.name || 'Candidate'}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={candidate.candidate_status} />
            <CategoryBadge category={candidate.shortlist_category} />
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-2">
          {candidate.candidate_status !== 'selected'
            ? <button onClick={() => action('select')} className="outline-btn text-sm">
                <CheckSquare size={15} /> Select
              </button>
            : <button onClick={() => action('unselect')} className="outline-btn text-sm text-amber-400 border-amber-500/30">
                <CheckSquare size={15} /> Unselect
              </button>}
          <button onClick={() => action('shortlist')} className="brand-btn text-sm">
            <Star size={15} /> Shortlist
          </button>
          <button onClick={deleteCandidate} className="danger-btn text-sm">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-800 p-1 rounded-xl w-fit border border-white/5">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${activeTab === tab ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {tab === 'profile' ? 'Profile & Scores' : 'Resume Viewer'}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left — Info */}
          <div className="xl:col-span-2 space-y-5">
            {/* Contact */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <h2 className="section-title mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: User,  label: 'Name',  value: candidate.name || '—' },
                  { icon: Mail,  label: 'Email', value: candidate.email || '—' },
                  { icon: Phone, label: 'Phone', value: candidate.phone || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-dark-700/40 rounded-xl">
                    <Icon size={15} className="text-brand-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                      <p className="text-white text-sm font-medium break-all">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Skills matched/missing */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6">
              <h2 className="section-title mb-4">Skill Analysis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-emerald-400 text-sm font-medium mb-2 flex items-center gap-1">
                    <CheckCircle size={14} /> Matched Skills ({candidate.matched_skills?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(candidate.matched_skills || []).map(s => (
                      <span key={s} className="badge bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">{s}</span>
                    ))}
                    {(candidate.matched_skills || []).length === 0 && <span className="text-slate-500 text-sm">None</span>}
                  </div>
                </div>
                <div>
                  <p className="text-red-400 text-sm font-medium mb-2 flex items-center gap-1">
                    <XCircle size={14} /> Missing Skills ({candidate.missing_skills?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(candidate.missing_skills || []).map(s => (
                      <span key={s} className="badge bg-red-500/15 text-red-300 border border-red-500/20">{s}</span>
                    ))}
                    {(candidate.missing_skills || []).length === 0 && <span className="text-slate-500 text-sm">None</span>}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-slate-400 text-sm font-medium mb-2">All Skills ({candidate.skills?.length || 0})</p>
                <div className="flex flex-wrap gap-1.5">
                  {(candidate.skills || []).map(s => (
                    <span key={s} className="badge bg-brand-600/10 text-brand-400 border border-brand-500/15">{s}</span>
                  ))}
                  {(candidate.skills || []).length === 0 && <span className="text-slate-500 text-sm">No skills extracted</span>}
                </div>
              </div>
            </motion.div>

            {/* Education & Experience */}
            {[
              { key: 'education', label: 'Education', icon: GraduationCap, data: candidate.education },
              { key: 'experience', label: 'Experience', icon: Briefcase, data: candidate.experience },
              { key: 'certifications', label: 'Certifications', icon: Award, data: candidate.certifications },
            ].map(({ key, label, icon: Icon, data }) => data?.length > 0 && (
              <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <h2 className="section-title mb-4 flex items-center gap-2">
                  <Icon size={18} className="text-brand-400" /> {label}
                </h2>
                <div className="space-y-2">
                  {data.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-dark-700/30 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 flex-shrink-0" />
                      <p className="text-slate-300 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right — Scores */}
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
              <h2 className="section-title mb-5 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-400" /> AI Score Breakdown
              </h2>
              <div className="space-y-4">
                <ScoreCard label="Final Score (Overall)" value={candidate.final_score} icon={TrendingUp} />
                <ScoreCard label="Semantic Match (70%)" value={candidate.semantic_similarity} icon={FileText} />
                <ScoreCard label="Skill Match (30%)" value={candidate.skill_match_score} icon={CheckCircle} />
              </div>

              <div className="mt-5 p-4 bg-dark-700/50 rounded-xl text-center">
                <p className="text-slate-400 text-xs mb-1">Formula</p>
                <p className="text-brand-300 text-xs font-mono">0.7 × semantic + 0.3 × skills</p>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        /* Resume viewer */
        <div className="glass-card p-6">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <FileText size={18} className="text-brand-400" /> Original Resume
          </h2>
          {isPdf ? (
            <div className="flex flex-col items-center">
              <Document
                file={resumeUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={() => toast.error('Could not load PDF')}
                className="max-w-full"
              >
                <Page pageNumber={pageNumber} width={Math.min(window.innerWidth - 300, 800)} />
              </Document>
              {numPages && numPages > 1 && (
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                    className="outline-btn px-3 py-2 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-slate-400 text-sm">Page {pageNumber} of {numPages}</span>
                  <button
                    onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                    disabled={pageNumber >= numPages}
                    className="outline-btn px-3 py-2 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">DOCX preview not available</p>
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="brand-btn mt-4 inline-flex"
              >
                Download Resume
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
