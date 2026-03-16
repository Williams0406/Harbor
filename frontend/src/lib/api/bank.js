import api from '../axios'

export const bankApi = {
  // Cuentas
  getAccounts:      ()       => api.get('/bank/accounts/'),
  getAccount:       (id)     => api.get(`/bank/accounts/${id}/`),
  createAccount:    (data)   => api.post('/bank/accounts/', data),
  updateAccount:    (id, data) => api.put(`/bank/accounts/${id}/`, data),
  deleteAccount:    (id)     => api.delete(`/bank/accounts/${id}/`),

  // Movimientos
  getMovements:     (params) => api.get('/bank/movements/', { params }),
  getMovement:      (id)     => api.get(`/bank/movements/${id}/`),
  createMovement:   (data)   => api.post('/bank/movements/', data),
  updateMovement:   (id, data) => api.put(`/bank/movements/${id}/`, data),
  deleteMovement:   (id)     => api.delete(`/bank/movements/${id}/`),
}