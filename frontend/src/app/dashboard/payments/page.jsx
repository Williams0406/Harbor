'use client'

import { useState, useEffect, useCallback } from 'react'
import { paymentsApi } from '@/lib/api/payments'
import { contactsApi } from '@/lib/api/contacts'
import PageShell from '@/components/ui/PageShell'
import Table     from '@/components/ui/Table'
import Modal     from '@/components/ui/Modal'
import Button    from '@/components/ui/Button'
import Input     from '@/components/ui/Input'
import Badge     from '@/components/ui/Badge'
import styles    from '../contacts/contacts.module.css'
import bStyles   from '../bank/bank.module.css'

const EMPTY = { detail: '', category: '', voucher_type: '', amount: '', contact: '' }
const CAT_OPTS = [{ value:'expense', label:'Egreso' }, { value:'income', label:'Ingreso' }]

export default function PaymentsPage() {
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
      if (filter) params.category = filter
      const [res, cRes] = await Promise.all([paymentsApi.getPayments(params), contactsApi.getContacts()])
      setData(res.data.results ?? res.data)
      setContacts(cRes.data.results ?? cRes.data)
    } catch { setData([]) } finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  function openCreate() { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ detail: row.detail, category: row.category, voucher_type: row.voucher_type || '', amount: row.amount, contact: row.contact || '' })
    setError(''); setModal(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este pago?')) return
    await paymentsApi.deletePayment(id); load()
  }

  async function handleSave() {
    if (!form.detail || !form.category || !form.amount) { setError('Detalle, categoría e importe son requeridos'); return }
    setSaving(true)
    try {
      const payload = { ...form, contact: form.contact || null }
      editing ? await paymentsApi.updatePayment(editing.id, payload) : await paymentsApi.createPayment(payload)
      setModal(false); load()
    } catch { setError('Error al guardar') } finally { setSaving(false) }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // Totals
  const totalIncome  = data.filter((r) => r.category === 'income').reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense = data.filter((r) => r.category === 'expense').reduce((s, r) => s + Number(r.amount), 0)

  const columns = [
    { key: 'detail',       label: 'Detalle',   render: (r) => <span style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',display:'block'}}>{r.detail}</span> },
    { key: 'category',     label: 'Tipo',     width: '100px', render: (r) => <Badge label={r.category === 'income' ? 'Ingreso' : 'Egreso'} variant={r.category === 'income' ? 'success' : 'danger'} /> },
    { key: 'voucher_type', label: 'Comprobante', render: (r) => r.voucher_type || '—' },
    { key: 'amount',       label: 'Monto',    width: '120px', render: (r) => <span className={`font-mono ${r.category === 'income' ? 'text-success' : 'text-danger'}`}>{Number(r.amount).toFixed(2)}</span> },
    { key: 'contact_name', label: 'Contacto', render: (r) => r.contact_name || '—' },
    { key: 'created_at',   label: 'Fecha',    width: '110px', render: (r) => r.created_at?.slice(0, 10) },
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
      title="Pagos"
      subtitle={`${data.length} registros`}
      actions={<Button onClick={openCreate}>+ Nuevo pago</Button>}
    >
      {/* Resumen */}
      {data.length > 0 && (
        <div style={{display:'flex',gap:12}}>
          {[
            { label:'Total ingresos', value: totalIncome,  color:'var(--success)' },
            { label:'Total egresos',  value: totalExpense, color:'var(--danger)'  },
            { label:'Balance',        value: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? 'var(--success)' : 'var(--danger)' },
          ].map((s) => (
            <div key={s.label} style={{background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',padding:'12px 18px',display:'flex',flexDirection:'column',gap:2}}>
              <span style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{s.label}</span>
              <span style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-mono)',color:s.color}}>{s.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.toolbar}>
        <select className={styles.filterSelect} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Egresos</option>
        </select>
      </div>

      <Table columns={columns} data={data} loading={loading} emptyMessage="No hay pagos registrados" />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar pago' : 'Nuevo pago'}>
        <div className={styles.form}>
          <Input label="Detalle *" value={form.detail} onChange={set('detail')} placeholder="Descripción del pago" />
          <div className={styles.row}>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <label style={{fontSize:12,fontWeight:500,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.02em'}}>Categoría *</label>
              <select className={bStyles.nativeSelect} value={form.category} onChange={set('category')}>
                <option value="">— Seleccionar —</option>
                {CAT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <Input label="Monto *" type="number" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" />
          </div>
          <div className={styles.row}>
            <Input label="Tipo de comprobante" value={form.voucher_type} onChange={set('voucher_type')} placeholder="Factura, Recibo..." />
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
            <Button loading={saving} onClick={handleSave}>{editing ? 'Guardar cambios' : 'Registrar pago'}</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}