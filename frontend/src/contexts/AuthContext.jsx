import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { setAccessToken, setSessionExpiredHandler } from '../services/api'
import { authService } from '../services/authService'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const { addToast } = useToast()

  // Try to restore session on mount via refresh cookie
  useEffect(() => {
    authService.refresh()
      .then(({ data }) => {
        setAccessToken(data.access_token)
        setUser(data.user)
      })
      .catch(() => {
        // Not logged in — that's fine
      })
      .finally(() => setInitialized(true))

    setSessionExpiredHandler(() => {
      setUser(null)
      setAccessToken(null)
      addToast('Your session has expired. Please log in again.', 'error')
    })
  }, []) // eslint-disable-line

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await authService.login({ email, password })
      setAccessToken(data.access_token)
      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const { data } = await authService.register(payload)
      setAccessToken(data.access_token)
      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try { await authService.logout() } catch {}
    setAccessToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((partial) => {
    setUser(prev => prev ? { ...prev, ...partial } : null)
  }, [])

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-200 border-t-brand-500 mx-auto" />
          <p className="text-gray-500 text-sm">Loading FoodHub...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, initialized, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
