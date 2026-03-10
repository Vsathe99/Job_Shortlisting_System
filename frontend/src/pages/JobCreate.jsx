import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Briefcase, Plus, X } from 'lucide-react'

export default function JobCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    experience_required: 0,
  })
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase()
    if (s && !skills.includes(s)) {
      setSkills(prev => [...prev, s])
      setSkillInput('')
    }
  }

  const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill() }
    if (e.key === ',') { e.preventDefault(); addSkill() }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description) { toast.error('Title and description required'); return }
    setLoading(true)
    try {
      const res = await api.post('/jobs', {
        ...form,
        required_skills: skills,
        experience_required: Number(form.experience_required),
      })
      toast.success('Job created successfully!')
      navigate(`/jobs/${res.data.id}/upload`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title">Create Job Posting</h1>
        <p className="text-slate-400 mt-1">Define the role and required skills for AI-powered candidate matching</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card p-8 space-y-6"
      >
        <div>
          <label className="label">Job Title *</label>
          <div className="relative">
            <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="input-field pl-10"
              placeholder="e.g. Senior ML Engineer"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Years of Experience Required</label>
          <input
            type="number"
            min="0"
            max="30"
            step="0.5"
            value={form.experience_required}
            onChange={e => setForm(p => ({ ...p, experience_required: e.target.value }))}
            className="input-field"
          />
        </div>

        <div>
          <label className="label">Job Description *</label>
          <textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="input-field resize-none"
            rows={6}
            placeholder="Describe the role, responsibilities, and requirements in detail. The more detail you provide, the better the AI can match candidates."
            required
          />
        </div>

        <div>
          <label className="label">Required Skills</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-field flex-1"
              placeholder="Type skill and press Enter (e.g. Python, BERT, Docker)"
            />
            <button type="button" onClick={addSkill} className="outline-btn px-4">
              <Plus size={16} />
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map(skill => (
                <span
                  key={skill}
                  className="badge bg-brand-600/20 text-brand-300 border border-brand-500/30 pr-1.5 gap-1.5"
                >
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="brand-btn flex-1 justify-center">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Plus size={18} /> Create Job & Upload Resumes</>}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="outline-btn px-6">
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  )
}
