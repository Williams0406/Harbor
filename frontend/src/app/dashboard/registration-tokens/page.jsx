'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import PageShell from '@/components/ui/PageShell'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import { registrationPeopleApi } from '@/lib/api/registrationPeople'
import styles from '../contacts/contacts.module.css'

const EMPTY = { full_name: '', email: '', phone: '', role: 'operator' }
const ROLE_OPTS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'operator', label: 'Operador' },
  { value: 'viewer', label: 'Solo lectura' },
]

export default function RegistrationTokensPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const registrationLinkBase = useMemo(() => {
    if (typeof window === 'undefined') return '/register-token'
    return `${window.location.origin}/register-token`
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      const res = await registrationPeopleApi.list(params)
      setData(res.data.results ?? res.data)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModal(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({
      full_name: row.full_name || '',
      email: row.email || '',
      phone: row.phone || '',
      role: row.role || 'operator',
    })
    setError('')
    setModal(true)
  }

  async function handleSave() {
    if (!form.full_name || !form.email || !form.role) {
      setError('Nombre, correo y rol son obligatorios')
      return
    }

    setSaving(true)
    try {
      if (editing) await registrationPeopleApi.update(editing.id, form)
      else await registrationPeopleApi.create(form)

      setModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.email?.[0] || e.response?.data?.detail || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta persona y su token?')) return
    await registrationPeopleApi.remove(id)
    load()
  }

  async function handleRegenerate(row) {
    await registrationPeopleApi.regenerateToken(row.id)
    load()
  }

  async function copyLink(row) {
    const link = `${registrationLinkBase}?token=${encodeURIComponent(row.token)}`
    await navigator.clipboard.writeText(link)
    alert('Link copiado al portapapeles')
  }

  const columns = [
    { key: 'full_name', label: 'Persona', render: (r) => <strong>{r.full_name}</strong> },
    { key: 'email', label: 'Correo', render: (r) => r.email },
    { key: 'role', label: 'Rol', render: (r) => <Badge label={r.role} variant={r.role === 'admin' ? 'danger' : r.role === 'viewer' ? 'purple' : 'info'} /> },
    { key: 'token_used', label: 'Estado token', render: (r) => <Badge label={r.token_used ? 'Usado' : 'Disponible'} variant={r.token_used ? 'neutral' : 'success'} /> },
    { key: 'token', label: 'Token', render: (r) => <span className="font-mono">{r.token}</span> },
    {
      key: 'actions', label: '', width: '250px',
      render: (r) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => copyLink(r)}>Copiar link</Button>
          <Button size="sm" variant="ghost" onClick={() => handleRegenerate(r)}>Regenerar</Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>✕</Button>
        </div>
      ),
    },
  ]

  return (
    <PageShell
      title="Personas y tokens de registro"
      subtitle="Crea invitaciones seguras para que las personas se registren con su token"
      actions={<Button onClick={openCreate}>+ Nueva persona</Button>}
    >
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Buscar por nombre, correo o token..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table columns={columns} data={data} loading={loading} emptyMessage="No hay personas registradas" />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar persona' : 'Nueva persona'}>
        <div className={styles.form}>
          <div className={styles.row}>
            <Input label="Nombre completo *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ej. María Torres" />
            <Input label="Correo *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="persona@correo.com" />
          </div>
          <div className={styles.row}>
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+51 999 999 999" />
            <Select label="Rol inicial *" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={ROLE_OPTS} />
          </div>

          <p className={styles.error} style={{ color: 'var(--text-muted)' }}>
            Al crear, se genera automáticamente un token único. Luego podrás copiar el enlace de registro.
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear persona'}</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}