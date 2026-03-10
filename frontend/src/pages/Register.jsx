import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brain, Mail, Lock, User, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'recruiter' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(form.email, form.password, form.full_name, form.role)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-md glow relative z-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">TalentAI</h1>
            <p className="text-slate-500 text-xs">AI Resume Shortlisting</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
        <p className="text-slate-400 text-sm mb-6">Start recruiting smarter with AI</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input name="full_name" type="text" value={form.full_name} onChange={handleChange}
                className="input-field pl-10" placeholder="Jane Smith" />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="input-field pl-10" placeholder="you@company.com" required />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input name="password" type="password" value={form.password} onChange={handleChange}
                className="input-field pl-10" placeholder="••••••••" required />
            </div>
          </div>

          <div>
            <label className="label">Role</label>
            <div className="relative">
              <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <select name="role" value={form.role} onChange={handleChange}
                className="input-field pl-10 cursor-pointer">
                <option value="recruiter">Recruiter</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="brand-btn w-full justify-center mt-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
