import { api } from './api'

export const orderService = {
  cart: () => api.get('/api/cart'),
  addItem: (payload) => api.post('/api/cart/items', payload),
  updateItem: (id, payload) => api.put(`/api/cart/items/${id}`, payload),
  removeItem: (id) => api.delete(`/api/cart/items/${id}`),
  clear: () => api.delete('/api/cart'),
  sync: (items) => api.post('/api/cart/sync', { items }),
  promo: (code) => api.post('/api/cart/promo-check', { code, subtotal: 0, delivery_fee: 0 }),
  create: (payload) => api.post('/api/orders', payload),
  list: (params) => api.get('/api/orders', { params }),
  get: (id) => api.get(`/api/orders/${id}`),
  cancel: (id) => api.put(`/api/orders/${id}/cancel`),
  status: (id, status) => api.put(`/api/orders/${id}/status`, { status }),
  confirmCash: (id) => api.post(`/api/orders/${id}/confirm-cash`),
  assignDriver: (id, driverId) => api.put(`/api/orders/${id}/driver`, { driver_id: driverId }),
}
