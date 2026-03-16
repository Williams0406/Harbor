'use client'

import { useState, useEffect, useCallback } from 'react'
import { itemsApi } from '@/lib/api/items'
import PageShell from '@/components/ui/PageShell'
import Table     from '@/components/ui/Table'
import Modal     from '@/components/ui/Modal'
import Button    from '@/components/ui/Button'
import Input     from '@/components/ui/Input'
import Select    from '@/components/ui/Select'
import Badge     from '@/components/ui/Badge'
import styles    from '../contacts/contacts.module.css'

const EMPTY = { category: '', code: '', description: '' }
const CAT_OPTS = [
  { value: 'product', label: 'Producto' },
  { value: 'service', label: 'Servicio' },
]

export default function ItemsPage() {
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
      const res = await itemsApi.getItems(params)
      setData(res.data.results ?? res.data)
    } catch { setData([]) }
    finally  { setLoading(false) }
  }, [search, filter])

  useEffect(() => { load() }, [load])

  function openCreate() { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ category: row.category, code: row.code, description: row.description })
    setError(''); setModal(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este ítem?')) return
    await itemsApi.deleteItem(id); load()
  }

  async function handleSave() {
    if (!form.code || !form.category || !form.description) { setError('Todos los campos son requeridos'); return }
    setSaving(true)
    try {
      editing ? await itemsApi.updateItem(editing.id, form) : await itemsApi.createItem(form)
      setModal(false); load()
    } catch (e) {
      setError(e.response?.data?.code?.[0] || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const columns = [
    { key: 'code',        label: 'Código',     width: '120px', render: (r) => <span className="font-mono">{r.code}</span> },
    { key: 'category',    label: 'Categoría',  width: '120px', render: (r) => <Badge label={r.category === 'product' ? 'Producto' : 'Servicio'} variant={r.category === 'product' ? 'success' : 'purple'} /> },
    { key: 'description', label: 'Descripción' },
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
      title="Ítems"
      subtitle={`${data.length} registros`}
      actions={<Button onClick={openCreate}>+ Nuevo ítem</Button>}
    >
      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="Buscar por código o descripción..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={styles.filterSelect} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="product">Productos</option>
          <option value="service">Servicios</option>
        </select>
      </div>

      <Table columns={columns} data={data} loading={loading} emptyMessage="No hay ítems registrados" />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar ítem' : 'Nuevo ítem'}>
        <div className={styles.form}>
          <div className={styles.row}>
            <Input label="Código *" value={form.code} onChange={set('code')} placeholder="PROD-001" />
            <Select label="Categoría *" value={form.category} onChange={set('category')} options={CAT_OPTS} />
          </div>
          <Input label="Descripción *" value={form.description} onChange={set('description')} placeholder="Descripción del ítem" />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear ítem'}</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}