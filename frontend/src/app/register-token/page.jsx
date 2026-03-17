'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { registerUserWithToken } from '@/lib/api/registrationPeople'
import styles from '../login/login.module.css'

export default function RegisterTokenPage() {
  const router = useRouter()
  const params = useSearchParams()

  const initialToken = useMemo(() => params.get('token') || '', [params])
  const [form, setForm] = useState({
    token: initialToken,
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function set(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.token || !form.username || !form.password || !form.confirmPassword) {
      setError('Token, usuario y contraseña son obligatorios')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await registerUserWithToken({
        token: form.token,
        username: form.username,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
      })
      setSuccess('Registro completado. Ya puedes iniciar sesión con tu usuario.')
      setTimeout(() => router.push('/login'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo completar el registro con token')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <div className={styles.panelLogo}>🔐</div>
          <h2 className={styles.panelTitle}>Registro por invitación</h2>
          <p className={styles.panelDesc}>
            Completa tus datos y usa el token asignado para crear tu cuenta.
          </p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Crear usuario con token</h1>
            <p className={styles.formSubtitle}>Este registro solo funciona con token válido</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input label="Token" value={form.token} onChange={(e) => set('token', e.target.value)} placeholder="Pega aquí tu token" />
            <Input label="Usuario" value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="usuario" />
            <Input label="Nombres" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="Nombres" />
            <Input label="Apellidos" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} placeholder="Apellidos" />
            <Input type="password" label="Contraseña" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
            <Input type="password" label="Confirmar contraseña" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="••••••••" />

            {error && <div className={styles.errorBox}><span>⚠</span>{error}</div>}
            {success && <div className={styles.errorBox} style={{ color: '#3fb950', borderColor: 'rgba(63,185,80,.35)', background: 'rgba(63,185,80,.12)' }}>{success}</div>}

            <Button type="submit" fullWidth loading={loading}>Registrar cuenta</Button>
          </form>
        </div>
      </div>
    </div>
  )
}