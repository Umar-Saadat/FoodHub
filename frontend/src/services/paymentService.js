import { api } from './api'

export const paymentService = {
  createIntent: (orderId) => api.post('/api/payments/create-intent', { order_id: orderId }),
  confirm: (orderId) => api.post('/api/payments/confirm', { order_id: orderId }),
  get: (orderId) => api.get(`/api/payments/${orderId}`),
}

export const adminService = {
  dashboard: () => api.get('/api/admin/dashboard'),
  users: (params) => api.get('/api/admin/users', { params }),
  createUser: (payload) => api.post('/api/admin/users', payload),
  updateUser: (id, payload) => api.put(`/api/admin/users/${id}`, payload),
  deactivateUser: (id) => api.delete(`/api/admin/users/${id}`),
  orders: (params) => api.get('/api/admin/orders', { params }),
  revenue: () => api.get('/api/admin/revenue'),
  drivers: () => api.get('/api/admin/drivers'),
  payments: () => api.get('/api/admin/payments'),
  promotions: () => api.get('/api/admin/promotions'),
  createPromotion: (payload) => api.post('/api/admin/promotions', payload),
  updatePromotion: (id, payload) => api.put(`/api/admin/promotions/${id}`, payload),
  deletePromotion: (id) => api.delete(`/api/admin/promotions/${id}`),
  createRestaurant: (payload) => api.post('/api/restaurants', payload),
  updateRestaurant: (id, payload) => api.put(`/api/restaurants/${id}`, payload),
  deleteRestaurant: (id) => api.delete(`/api/restaurants/${id}`),
  createFood: (payload) => api.post('/api/foods', payload),
  updateFood: (id, payload) => api.put(`/api/foods/${id}`, payload),
  deleteFood: (id) => api.delete(`/api/foods/${id}`),
  createCategory: (payload) => api.post('/api/categories', payload),
  updateCategory: (id, payload) => api.put(`/api/categories/${id}`, payload),
  deleteCategory: (id) => api.delete(`/api/categories/${id}`),
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/admin/upload', form)
  },
}

export const driverService = {
  assignments: () => api.get('/api/drivers/assignments'),
  availability: (isAvailable) => api.put('/api/drivers/availability', { is_available: isAvailable }),
  location: (payload) => api.post('/api/drivers/location', payload),
}
