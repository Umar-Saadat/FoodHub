import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL,
  withCredentials: true,
})

let accessToken = null
let hadSession = false
let onSessionExpired = null
let refreshPromise = null

export const setAccessToken = (token) => {
  accessToken = token || null
  hadSession = Boolean(accessToken)
}

export const getAccessToken = () => accessToken

export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler
}

export function wsUrl(path) {
  const explicit = import.meta.env.VITE_API_URL
  const token = accessToken ? `token=${encodeURIComponent(accessToken)}` : ''
  const joiner = path.includes('?') ? '&' : '?'
  if (explicit) {
    const url = new URL(explicit)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${url.origin}${path}${token ? `${joiner}${token}` : ''}`
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${path}${token ? `${joiner}${token}` : ''}`
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {}
    const url = original.url || ''
    const isAuthCall = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'].some((path) => url.includes(path))
    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        refreshPromise = refreshPromise || axios.post(`${baseURL}/api/auth/refresh`, {}, { withCredentials: true })
        const { data } = await refreshPromise
        refreshPromise = null
        setAccessToken(data.access_token)
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch (refreshError) {
        refreshPromise = null
        const expired = hadSession
        setAccessToken(null)
        if (expired && onSessionExpired) onSessionExpired()
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => (typeof item === 'string' ? item : item.msg)).filter(Boolean).join(' ')
  }
  return fallback
}
