'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser } from '@/lib/auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ username: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Completa todos los campos')
      return
    }

    setLoading(true)
    try {
      await loginUser(form.username, form.password)
      router.push('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Panel izquierdo — decorativo */}
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <div className={styles.panelLogo}>⬡</div>
          <h2 className={styles.panelTitle}>Harbor Supplies</h2>
          <p className={styles.panelDesc}>
            Sistema de gestión empresarial para operaciones marítimas y logísticas.
          </p>
          <div className={styles.panelStats}>
            {['Banco', 'Compras', 'Ventas', 'Inventario', 'Pagos', 'Reportes'].map((m) => (
              <span key={m} className={styles.panelTag}>{m}</span>
            ))}
          </div>
        </div>
        <div className={styles.panelGrid} aria-hidden="true" />
      </div>

      {/* Panel derecho — formulario */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Iniciar sesión</h1>
            <p className={styles.formSubtitle}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              id="username"
              name="username"
              label="Usuario"
              placeholder="nombre de usuario"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />

            {error && (
              <div className={styles.errorBox}>
                <span>⚠</span> {error}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
            >
              Ingresar al sistema
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}