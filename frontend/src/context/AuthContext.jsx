import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('ats_token'))
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async (tkn) => {
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${tkn}` },
      })
      setUser(res.data)
    } catch {
      localStorage.removeItem('ats_token')
      setToken(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchMe(token).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token, fetchMe])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('ats_token', access_token)
    setToken(access_token)
    setUser(userData)
    return userData
  }

  const register = async (email, password, full_name, role) => {
    const res = await api.post('/auth/register', { email, password, full_name, role })
    const { access_token, user: userData } = res.data
    localStorage.setItem('ats_token', access_token)
    setToken(access_token)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('ats_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
