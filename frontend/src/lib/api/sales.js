import api from '../axios'

export const salesApi = {
  getSales:   (params)   => api.get('/sales/', { params }),
  getSale:    (id)       => api.get(`/sales/${id}/`),
  createSale: (data)     => api.post('/sales/', data),
  updateSale: (id, data) => api.put(`/sales/${id}/`, data),
  deleteSale: (id)       => api.delete(`/sales/${id}/`),
}