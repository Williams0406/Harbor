'use client'

import { useState, useEffect, useCallback } from 'react'
import { purchasesApi } from '@/lib/api/purchases'
import { contactsApi }  from '@/lib/api/contacts'
import PageShell from '@/components/ui/PageShell'
import Table     from '@/components/ui/Table'
import Modal     from '@/components/ui/Modal'
import Button    from '@/components/ui/Button'
import Input     from '@/components/ui/Input'
import Badge     from '@/components/ui/Badge'
import styles    from '../contacts/contacts.module.css'
import bStyles   from '../bank/bank.module.css'

const EMPTY = { voucher_type: '', voucher_number: '', status: 'pending', contact: '' }
const STATUS_OPTS = [
  { value: 'pending',    label: 'Pendiente'   },
  { value: 'in_process', label: 'En proceso'  },
  { value: 'cancelled',  label: 'Cancelado'   },
]
const STATUS_LABELS = { pending: 'Pendiente', in_process: 'En proceso', cancelled: 'Cancelado' }
const STATUS_VARIANTS = { pending: 'warning', in_process: 'info', cancelled: 'danger' }

export default function PurchasesPage() {
  const [data, setData]         = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter) params.status = filter
      const [res, cRes] = await Promise.all([
        purchasesApi.getPurchases(params),
        contactsApi.getContacts(),
      ])
      setData(res.data.results ?? res.data)
      setContacts(cRes.data.results ?? cRes.data)
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  function openCreate() { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ voucher_type: row.voucher_type, voucher_number: row.voucher_number, status: row.status, contact: row.contact || '' })
    setError(''); setModal(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta compra?')) return
    await purchasesApi.deletePurchase(id); load()
  }

  async function handleSave() {
    if (!form.voucher_type || !form.voucher_number) { setError('Tipo y número de comprobante son requeridos'); return }
    setSaving(true)
    try {
      const payload = { ...form, contact: form.contact || null }
      editing ? await purchasesApi.updatePurchase(editing.id, payload) : await purchasesApi.createPurchase(payload)
      setModal(false); load()
    } catch { setError('Error al guardar') }
    finally { setSaving(false) }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const columns = [
    { key: 'voucher_type',   label: 'Tipo',    width: '140px' },
    { key: 'voucher_number', label: 'N° Comprobante', render: (r) => <span className="font-mono">{r.voucher_number}</span> },
    { key: 'status',         label: 'Estado',  width: '120px', render: (r) => <Badge label={STATUS_LABELS[r.status]} variant={STATUS_VARIANTS[r.status]} /> },
    { key: 'contact_name',   label: 'Contacto', render: (r) => r.contact_name || '—' },
    { key: 'created_at',     label: 'Fecha',   width: '110px', render: (r) => r.created_at?.slice(0, 10) },
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
      title="Compras"
      subtitle={`${data.length} registros`}
      actions={<Button onClick={openCreate}>+ Nueva compra</Button>}
    >
      <div className={styles.toolbar}>
        <select className={styles.filterSelect} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <Table columns={columns} data={data} loading={loading} emptyMessage="No hay compras registradas" />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar compra' : 'Nueva compra'}>
        <div className={styles.form}>
          <div className={styles.row}>
            <Input label="Tipo de comprobante *" value={form.voucher_type} onChange={set('voucher_type')} placeholder="Factura, Boleta, Nota..." />
            <Input label="N° de comprobante *"   value={form.voucher_number} onChange={set('voucher_number')} placeholder="F001-00001" />
          </div>
          <div className={styles.row}>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <label style={{fontSize:12,fontWeight:500,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.02em'}}>Estado</label>
              <select className={bStyles.nativeSelect} value={form.status} onChange={set('status')}>
                {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <label style={{fontSize:12,fontWeight:500,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.02em'}}>Contacto</label>
              <select className={bStyles.nativeSelect} value={form.contact} onChange={set('contact')}>
                <option value="">— Sin contacto —</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear compra'}</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}