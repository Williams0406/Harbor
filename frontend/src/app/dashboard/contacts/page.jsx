'use client'

import { useState, useEffect, useCallback } from 'react'
import { contactsApi } from '@/lib/api/contacts'
import PageShell   from '@/components/ui/PageShell'
import Table       from '@/components/ui/Table'
import Modal       from '@/components/ui/Modal'
import Button      from '@/components/ui/Button'
import Input       from '@/components/ui/Input'
import Select      from '@/components/ui/Select'
import Badge       from '@/components/ui/Badge'
import styles      from './contacts.module.css'

const EMPTY = { category: '', name: '', phone: '', email: '', ruc_dni: '', business_name: '', reference: '' }

const CATEGORY_OPTS = [
  { value: 'buyer',  label: 'Comprador' },
  { value: 'seller', label: 'Vendedor'  },
]

export default function ContactsPage() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('')
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search   = search
      if (filter) params.category = filter
      const res = await contactsApi.getContacts(params)
      setData(res.data.results ?? res.data)
    } catch { setData([]) }
    finally  { setLoading(false) }
  }, [search, filter])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModal(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({ category: row.category, name: row.name, phone: row.phone || '', email: row.email || '', ruc_dni: row.ruc_dni || '', business_name: row.business_name || '', reference: row.reference || '' })
    setError('')
    setModal(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este contacto?')) return
    await contactsApi.deleteContact(id)
    load()
  }

  async function handleSave() {
    if (!form.name || !form.category) { setError('Nombre y categoría son requeridos'); return }
    setSaving(true)
    try {
      editing
        ? await contactsApi.updateContact(editing.id, form)
        : await contactsApi.createContact(form)
      setModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.name?.[0] || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const columns = [
    { key: 'name',          label: 'Nombre',       render: (r) => <strong>{r.name}</strong> },
    { key: 'category',      label: 'Categoría',    render: (r) => <Badge label={r.category === 'buyer' ? 'Comprador' : 'Vendedor'} variant={r.category === 'buyer' ? 'info' : 'success'} /> },
    { key: 'ruc_dni',       label: 'RUC / DNI',    render: (r) => <span className="font-mono">{r.ruc_dni || '—'}</span> },
    { key: 'business_name', label: 'Razón social'  },
    { key: 'phone',         label: 'Teléfono'      },
    { key: 'email',         label: 'Correo'        },
    { key: 'actions', label: '', width: '100px',
      render: (r) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>✕</Button>
        </div>
      )
    },
  ]

  return (
    <PageShell
      title="Contactos"
      subtitle={`${data.length} registros`}
      actions={<Button onClick={openCreate}>+ Nuevo contacto</Button>}
    >
      {/* Filtros */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Buscar por nombre, RUC, razón social..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={styles.filterSelect} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="buyer">Compradores</option>
          <option value="seller">Vendedores</option>
        </select>
      </div>

      <Table columns={columns} data={data} loading={loading} emptyMessage="No hay contactos registrados" />

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar contacto' : 'Nuevo contacto'}>
        <div className={styles.form}>
          <div className={styles.row}>
            <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" />
            <Select label="Categoría *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORY_OPTS} />
          </div>
          <div className={styles.row}>
            <Input label="RUC / DNI" value={form.ruc_dni} onChange={(e) => setForm({ ...form, ruc_dni: e.target.value })} placeholder="20xxxxxxxxx" />
            <Input label="Razón social" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Nombre de empresa" />
          </div>
          <div className={styles.row}>
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+51 999 999 999" />
            <Input label="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@empresa.com" />
          </div>
          <Input label="Referencia" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Notas adicionales" />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear contacto'}</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}