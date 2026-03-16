import axiosInstance from './axios'

// ── Login ─────────────────────────────────────────────────────────────────────
export async function loginUser(username, password) {
  const response = await axiosInstance.post('/auth/login/', { username, password })
  const { access, refresh, user } = response.data

  localStorage.setItem('access_token',  access)
  localStorage.setItem('refresh_token', refresh)
  localStorage.setItem('user',          JSON.stringify(user))

  return user
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logoutUser() {
  try {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) {
      await axiosInstance.post('/auth/logout/', { refresh })
    }
  } catch {
    // Ignorar errores de logout en el servidor
  } finally {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}

// ── Helpers de sesión ─────────────────────────────────────────────────────────
export function getUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isAuthenticated() {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('access_token')
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}