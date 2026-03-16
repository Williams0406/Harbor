import api from '../axios'

export const paymentsApi = {
  getPayments:   (params)   => api.get('/payments/', { params }),
  getPayment:    (id)       => api.get(`/payments/${id}/`),
  createPayment: (data)     => api.post('/payments/', data),
  updatePayment: (id, data) => api.put(`/payments/${id}/`, data),
  deletePayment: (id)       => api.delete(`/payments/${id}/`),
}