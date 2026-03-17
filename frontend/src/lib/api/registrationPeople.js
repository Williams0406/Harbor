import api from '../axios'

export const registrationPeopleApi = {
  list: (params) => api.get('/registration-people/', { params }),
  create: (data) => api.post('/registration-people/', data),
  update: (id, data) => api.put(`/registration-people/${id}/`, data),
  remove: (id) => api.delete(`/registration-people/${id}/`),
  regenerateToken: (id) => api.post(`/registration-people/${id}/regenerate-token/`),
}

export async function registerUserWithToken(payload) {
  const response = await api.post('/auth/register-with-token/', payload)
  return response.data
}