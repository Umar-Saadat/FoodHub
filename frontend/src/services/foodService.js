import { api } from './api'

export const foodService = {
  restaurants: (params) => api.get('/api/restaurants', { params }),
  restaurant: (id) => api.get(`/api/restaurants/${id}`),
  foods: (params) => api.get('/api/foods', { params }),
  food: (id) => api.get(`/api/foods/${id}`),
  categories: (params) => api.get('/api/categories', { params }),
  review: (restaurantId, payload) => api.post(`/api/restaurants/${restaurantId}/reviews`, payload),
  config: () => api.get('/api/config'),
}
