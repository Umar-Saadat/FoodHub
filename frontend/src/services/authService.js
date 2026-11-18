import { api } from './api'

export const authService = {
  register: (payload) => api.post('/api/auth/register', payload),
  login: (payload) => api.post('/api/auth/login', payload),
  refresh: () => api.post('/api/auth/refresh'),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  updateMe: (payload) => api.put('/api/auth/me', payload),
  changePassword: (payload) => api.put('/api/users/me/password', payload),
  addresses: () => api.get('/api/users/me/addresses'),
  addAddress: (payload) => api.post('/api/users/me/addresses', payload),
  updateAddress: (id, payload) => api.put(`/api/users/me/addresses/${id}`, payload),
  deleteAddress: (id) => api.delete(`/api/users/me/addresses/${id}`),
}
