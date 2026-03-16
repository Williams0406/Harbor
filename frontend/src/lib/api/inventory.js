import api from '../axios'

export const inventoryApi = {
  getEntries:   (params)   => api.get('/inventory/', { params }),
  getEntry:     (id)       => api.get(`/inventory/${id}/`),
  createEntry:  (data)     => api.post('/inventory/', data),
  updateEntry:  (id, data) => api.put(`/inventory/${id}/`, data),
  deleteEntry:  (id)       => api.delete(`/inventory/${id}/`),
}