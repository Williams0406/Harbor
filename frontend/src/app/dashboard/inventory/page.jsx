'use client'

import { useState, useEffect, useCallback } from 'react'
import { inventoryApi } from '@/lib/api/inventory'
import { itemsApi }     from '@/lib/api/items'
import PageShell from '@/components/ui/PageShell'
import Table     from '@/components/ui/Table'
import Modal     from '@/components/ui/Modal'
import Button    from '@/components/ui/Button'
import Input     from '@/components/ui/Input'
import styles    from '../contacts/contacts.module.css'
import bStyles   from '../bank/bank.module.css'

const EMPTY = { item: '', quantity: '' }

export default function InventoryPage() {
  const [data, setData]     = useState([])
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, iRes] = await Promise.all([inventoryApi.getEntries(), itemsApi.getItems()])
      setData(res.data.results ?? res.data)
      setItems(iRes.data.results ?? iRes.data)
    } catch { setData([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta entrada?')) return
    await inventoryApi.deleteEntry(id); load()
  }

  async function handleSave() {
    if (!form.item || !form.quantity) { setError('Ítem y cantidad son requeridos'); return }
    setSaving(true)
    try {
      await inventoryApi.createEntry(form)
      setModal(false); load()
    } catch { setError('Error al guardar') } finally { setSaving(false) }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const columns = [
    { key: 'item_code',        label: 'Código',      width:'120px', render: (r) => <span className="font-mono">{r.item_code || '—'}</span> },
    { key: 'item_description', label: 'Descripción', render: (r) => r.item_description || '—' },
    { key: 'quantity',         label: 'Cantidad',    width:'120px', render: (r) => <span className="font-mono">{Number(r.quantity).toFixed(2)}</span> },
    { key: 'created_at',       label: 'Fecha',       width:'110px', render: (r) => r.created_at?.slice(0, 10) },
    { key: 'actions', label: '', width: '80px',
      render: (r) => (
        <div className={styles.actions}>
          <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>✕</Button>
        </div>
      )
    },
  ]

  return (
    <PageShell
      title="Inventario"
      subtitle={`${data.length} entradas`}
      actions={<Button onClick={() => { setForm(EMPTY); setError(''); setModal(true) }}>+ Nueva entrada</Button>}
    >
      <Table columns={columns} data={data} loading={loading} emptyMessage="No hay entradas de inventario" />

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva entrada de inventario">
        <div className={styles.form}>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <label style={{fontSize:12,fontWeight:500,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.02em'}}>Ítem *</label>
            <select className={bStyles.nativeSelect} value={form.item} onChange={set('item')}>
              <option value="">— Seleccionar ítem —</option>
              {items.map((i) => <option key={i.id} value={i.id}>[{i.code}] {i.description.slice(0,60)}</option>)}
            </select>
          </div>
          <Input label="Cantidad *" type="number" step="0.01" value={form.quantity} onChange={set('quantity')} placeholder="0.00" />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>Registrar entrada</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}