import api from '../axios'

export const reportsApi = {
  getReports:   (params)      => api.get('/reports/', { params }),
  getReport:    (id)          => api.get(`/reports/${id}/`),
  createReport: (data)        => api.post('/reports/', data),
  updateReport: (id, data)    => api.put(`/reports/${id}/`, data),
  patchReport:  (id, data)    => api.patch(`/reports/${id}/`, data),
  deleteReport: (id)          => api.delete(`/reports/${id}/`),
}