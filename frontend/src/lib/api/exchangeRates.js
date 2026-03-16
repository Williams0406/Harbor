import api from '../axios'

export const exchangeRatesApi = {
  getRates:   (params)   => api.get('/exchange-rates/', { params }),
  getRate:    (id)       => api.get(`/exchange-rates/${id}/`),
  createRate: (data)     => api.post('/exchange-rates/', data),
  updateRate: (id, data) => api.put(`/exchange-rates/${id}/`, data),
  deleteRate: (id)       => api.delete(`/exchange-rates/${id}/`),
}