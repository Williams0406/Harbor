import api from '../axios'

export const purchasesApi = {
  getPurchases:   (params)   => api.get('/purchases/', { params }),
  getPurchase:    (id)       => api.get(`/purchases/${id}/`),
  createPurchase: (data)     => api.post('/purchases/', data),
  updatePurchase: (id, data) => api.put(`/purchases/${id}/`, data),
  deletePurchase: (id)       => api.delete(`/purchases/${id}/`),
}