'use client'

import { useState, useEffect, useCallback } from 'react'
import { exchangeRatesApi } from '@/lib/api/exchangeRates'
import PageShell from '@/components/ui/PageShell'
import Table     from '@/components/ui/Table'
import Modal     from '@/components/ui/Modal'
import Button    from '@/components/ui/Button'
import Input     from '@/components/ui/Input'
import styles    from '../contacts/contacts.module.css'

const EMPTY = { date: '', buy_dollar: '', sell_dollar: '', buy_euro: '', sell_euro: '' }

export default function ExchangeRatesPage() {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { const res = await exchangeRatesApi.getRates(); setData(res.data.results ?? res.data) }
    catch { setData([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ date: row.date, buy_dollar: row.buy_dollar, sell_dollar: row.sell_dollar, buy_euro: row.buy_euro, sell_euro: row.sell_euro })
    setError(''); setModal(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este tipo de cambio?')) return
    await exchangeRatesApi.deleteRate(id); load()
  }

  async function handleSave() {
    if (!form.date || !form.buy_dollar || !form.sell_dollar || !form.buy_euro || !form.sell_euro) {
      setError('Todos los campos son requeridos'); return
    }
    setSaving(true)
    try {
      editing ? await exchangeRatesApi.updateRate(editing.id, form) : await exchangeRatesApi.createRate(form)
      setModal(false); load()
    } catch (e) { setError(e.response?.data?.date?.[0] || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const columns = [
    { key: 'date',        label: 'Fecha',         width:'120px' },
    { key: 'buy_dollar',  label: 'Compra USD',    width:'120px', render: (r) => <span className="font-mono text-success">{Number(r.buy_dollar).toFixed(4)}</span> },
    { key: 'sell_dollar', label: 'Venta USD',     width:'120px', render: (r) => <span className="font-mono text-danger">{Number(r.sell_dollar).toFixed(4)}</span> },
    { key: 'buy_euro',    label: 'Compra EUR',    width:'120px', render: (r) => <span className="font-mono text-success">{Number(r.buy_euro).toFixed(4)}</span> },
    { key: 'sell_euro',   label: 'Venta EUR',     width:'120px', render: (r) => <span className="font-mono text-danger">{Number(r.sell_euro).toFixed(4)}</span> },
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
      title="Tipo de Cambio"
      subtitle="USD / EUR — Compra y venta"
      actions={<Button onClick={openCreate}>+ Nuevo registro</Button>}
    >
      <Table columns={columns} data={data} loading={loading} emptyMessage="No hay tipos de cambio registrados" />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar tipo de cambio' : 'Nuevo tipo de cambio'}>
        <div className={styles.form}>
          <Input label="Fecha *" type="date" value={form.date} onChange={set('date')} />
          <div className={styles.row}>
            <Input label="Compra USD *"  type="number" step="0.0001" value={form.buy_dollar}  onChange={set('buy_dollar')}  placeholder="3.8000" />
            <Input label="Venta USD *"   type="number" step="0.0001" value={form.sell_dollar} onChange={set('sell_dollar')} placeholder="3.8200" />
          </div>
          <div className={styles.row}>
            <Input label="Compra EUR *"  type="number" step="0.0001" value={form.buy_euro}    onChange={set('buy_euro')}    placeholder="4.1000" />
            <Input label="Venta EUR *"   type="number" step="0.0001" value={form.sell_euro}   onChange={set('sell_euro')}   placeholder="4.1500" />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Guardar cambios' : 'Registrar'}</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}