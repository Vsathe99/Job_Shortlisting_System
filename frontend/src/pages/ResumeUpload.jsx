import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import api from '../api/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, CheckCircle, AlertCircle, ArrowLeft,
  Loader, Trash2, Users
} from 'lucide-react'

export default function ResumeUpload() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState(null)

  useEffect(() => {
    api.get(`/jobs/${jobId}`).then(r => setJob(r.data)).catch(() => toast.error('Job not found'))
  }, [jobId])

  const onDrop = useCallback((accepted) => {
    const valid = accepted.filter(f =>
      f.name.endsWith('.pdf') || f.name.endsWith('.docx')
    )
    if (valid.length < accepted.length) toast.error('Only PDF and DOCX files are supported')
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !names.has(f.name))]
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    multiple: true,
  })

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name))

  const handleUpload = async () => {
    if (files.length === 0) { toast.error('Please select files first'); return }
    setUploading(true)
    setResults(null)

    const formData = new FormData()
    formData.append('job_id', jobId)
    files.forEach(f => formData.append('files', f))

    try {
      const res = await api.post('/upload-resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      setResults(res.data)
      toast.success(`Processed ${res.data.processed} resume(s)!`)
      setFiles([])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">Upload Resumes</h1>
          {job && <p className="text-slate-400 text-sm mt-0.5">For: <strong className="text-brand-300">{job.title}</strong></p>}
        </div>
      </div>

      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        {...getRootProps()}
        className={`glass-card p-10 text-center cursor-pointer border-2 border-dashed transition-all duration-200
          ${isDragActive ? 'border-brand-500 bg-brand-600/10' : 'border-white/10 hover:border-brand-500/50 hover:bg-brand-600/5'}`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-2xl bg-brand-600/20 flex items-center justify-center mx-auto mb-4">
          <Upload size={28} className="text-brand-400" />
        </div>
        <p className="text-white font-semibold text-lg mb-1">
          {isDragActive ? 'Drop files here' : 'Drag & Drop Resumes'}
        </p>
        <p className="text-slate-400 text-sm">PDF and DOCX supported · Multiple files allowed</p>
        <button className="outline-btn mt-4 mx-auto">Browse Files</button>
      </motion.div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-4 mt-4 space-y-2"
          >
            <p className="text-slate-400 text-sm mb-3">{files.length} file(s) selected</p>
            {files.map(file => (
              <div key={file.name} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-brand-400 flex-shrink-0" />
                  <span className="text-white text-sm truncate max-w-xs">{file.name}</span>
                  <span className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button onClick={() => removeFile(file.name)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className="brand-btn w-full justify-center mt-4"
      >
        {uploading ? (
          <>
            <Loader size={18} className="animate-spin" />
            Processing with AI... (this may take a minute)
          </>
        ) : (
          <>
            <Upload size={18} />
            Analyze {files.length > 0 ? `${files.length} Resume${files.length > 1 ? 's' : ''}` : 'Resumes'}
          </>
        )}
      </button>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mt-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="section-title">Processing Results</h3>
              <div className="flex gap-2">
                <span className="badge bg-emerald-500/20 text-emerald-300">{results.processed} processed</span>
                {results.failed > 0 && (
                  <span className="badge bg-red-500/20 text-red-300">{results.failed} failed</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {results.results.map(r => (
                <div key={r.candidate_id} className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-400" />
                    <span className="text-white text-sm">{r.name || r.file}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${r.shortlist_category === 'Top Candidate'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : r.shortlist_category === 'Potential Candidate'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-300'}`}>
                      {r.shortlist_category}
                    </span>
                    <span className="text-white font-bold text-sm">{Math.round(r.final_score * 100)}%</span>
                  </div>
                </div>
              ))}
              {results.errors.map(e => (
                <div key={e.file} className="flex items-center gap-2 p-3 bg-red-500/10 rounded-xl">
                  <AlertCircle size={14} className="text-red-400" />
                  <span className="text-red-300 text-sm">{e.file}: {e.error}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate(`/jobs/${jobId}/candidates`)}
              className="brand-btn w-full justify-center"
            >
              <Users size={18} />
              View Ranked Candidates
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
