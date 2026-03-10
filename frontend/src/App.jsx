import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import JobCreate from './pages/JobCreate'
import ResumeUpload from './pages/ResumeUpload'
import CandidateRanking from './pages/CandidateRanking'
import CandidateProfile from './pages/CandidateProfile'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs/new" element={<JobCreate />} />
            <Route path="/jobs/:jobId/upload" element={<ResumeUpload />} />
            <Route path="/jobs/:jobId/candidates" element={<CandidateRanking />} />
            <Route path="/candidates/:candidateId" element={<CandidateProfile />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
