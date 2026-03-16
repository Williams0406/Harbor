'use client'

import { useState, useEffect, useCallback } from 'react'
import { bankApi } from '@/lib/api/bank'
import PageShell from '@/components/ui/PageShell'
import Table     from '@/components/ui/Table'
import Modal     from '@/components/ui/Modal'
import Button    from '@/components/ui/Button'
import Input     from '@/components/ui/Input'
import styles    from '../contacts/contacts.module.css'
import mStyles   from './bank.module.css'

const EMPTY_ACC = { bank_name: '', account_number: '', cci: '' }
const EMPTY_MOV = { account: '', operation_date: '', value_date: '', reference: '', amount: '', itf: '0', movement_number: '' }

export default function BankPage() {
  const [accounts, setAccounts]     = useState([])
  const [movements, setMovements]   = useState([])
  const [loadingAcc, setLoadingAcc] = useState(true)
  const [loadingMov, setLoadingMov] = useState(true)
  const [tab, setTab]               = useState('accounts')

  // Modal cuentas
  const [accModal, setAccModal]   = useState(false)
  const [editingAcc, setEditingAcc] = useState(null)
  const [accForm, setAccForm]     = useState(EMPTY_ACC)
  const [accSaving, setAccSaving] = useState(false)
  const [accError, setAccError]   = useState('')

  // Modal movimientos
  const [movModal, setMovModal]   = useState(false)
  const [movForm, setMovForm]     = useState(EMPTY_MOV)
  const [movSaving, setMovSaving] = useState(false)
  const [movError, setMovError]   = useState('')

  const loadAccounts = useCallback(async () => {
    setLoadingAcc(true)
    try { const r = await bankApi.getAccounts(); setAccounts(r.data.results ?? r.data) }
    catch { setAccounts([]) } finally { setLoadingAcc(false) }
  }, [])

  const loadMovements = useCallback(async () => {
    setLoadingMov(true)
    try { const r = await bankApi.getMovements(); setMovements(r.data.results ?? r.data) }
    catch { setMovements([]) } finally { setLoadingMov(false) }
  }, [])

  useEffect(() => { loadAccounts(); loadMovements() }, [loadAccounts, loadMovements])

  // Cuentas
  async function saveAccount() {
    if (!accForm.bank_name || !accForm.account_number) { setAccError('Banco y número de cuenta son requeridos'); return }
    setAccSaving(true)
    try {
      editingAcc ? await bankApi.updateAccount(editingAcc.id, accForm) : await bankApi.createAccount(accForm)
      setAccModal(false); loadAccounts()
    } catch (e) { setAccError(e.response?.data?.account_number?.[0] || 'Error al guardar') }
    finally { setAccSaving(false) }
  }

  // Movimientos
  async function saveMovement() {
    if (!movForm.account || !movForm.operation_date || !movForm.amount) { setMovError('Cuenta, fecha e importe son requeridos'); return }
    setMovSaving(true)
    try {
      await bankApi.createMovement(movForm)
      setMovModal(false); loadMovements()
    } catch (e) { setMovError('Error al guardar') }
    finally { setMovSaving(false) }
  }

  const accColumns = [
    { key: 'bank_name',      label: 'Banco' },
    { key: 'account_number', label: 'Número de cuenta', render: (r) => <span className="font-mono">{r.account_number}</span> },
    { key: 'cci',            label: 'CCI', render: (r) => <span className="font-mono">{r.cci || '—'}</span> },
    { key: 'actions', label: '', width: '100px',
      render: (r) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => { setEditingAcc(r); setAccForm({ bank_name: r.bank_name, account_number: r.account_number, cci: r.cci || '' }); setAccError(''); setAccModal(true) }}>Editar</Button>
          <Button size="sm" variant="danger" onClick={async () => { if (confirm('¿Eliminar cuenta?')) { await bankApi.deleteAccount(r.id); loadAccounts() } }}>✕</Button>
        </div>
      )
    },
  ]

  const movColumns = [
    { key: 'account_name',   label: 'Cuenta' },
    { key: 'operation_date', label: 'Fecha op.' },
    { key: 'value_date',     label: 'Fecha valor' },
    { key: 'reference',      label: 'Referencia' },
    { key: 'amount',         label: 'Importe',    render: (r) => <span className={`font-mono ${Number(r.amount) >= 0 ? 'text-success' : 'text-danger'}`}>{Number(r.amount).toFixed(2)}</span> },
    { key: 'itf',            label: 'ITF',         render: (r) => <span className="font-mono">{Number(r.itf).toFixed(2)}</span> },
    { key: 'movement_number', label: 'N° mov.' },
  ]

  const setA = (k) => (e) => setAccForm({ ...accForm, [k]: e.target.value })
  const setM = (k) => (e) => setMovForm({ ...movForm, [k]: e.target.value })

  return (
    <PageShell
      title="Banco"
      subtitle="Cuentas y movimientos bancarios"
      actions={
        tab === 'accounts'
          ? <Button onClick={() => { setEditingAcc(null); setAccForm(EMPTY_ACC); setAccError(''); setAccModal(true) }}>+ Nueva cuenta</Button>
          : <Button onClick={() => { setMovForm(EMPTY_MOV); setMovError(''); setMovModal(true) }}>+ Nuevo movimiento</Button>
      }
    >
      {/* Tabs */}
      <div className={mStyles.tabs}>
        <button className={[mStyles.tab, tab === 'accounts' ? mStyles.tabActive : ''].join(' ')} onClick={() => setTab('accounts')}>Cuentas ({accounts.length})</button>
        <button className={[mStyles.tab, tab === 'movements' ? mStyles.tabActive : ''].join(' ')} onClick={() => setTab('movements')}>Movimientos ({movements.length})</button>
      </div>

      {tab === 'accounts'
        ? <Table columns={accColumns} data={accounts} loading={loadingAcc} emptyMessage="No hay cuentas registradas" />
        : <Table columns={movColumns} data={movements} loading={loadingMov} emptyMessage="No hay movimientos registrados" />
      }

      {/* Modal cuentas */}
      <Modal open={accModal} onClose={() => setAccModal(false)} title={editingAcc ? 'Editar cuenta' : 'Nueva cuenta bancaria'}>
        <div className={styles.form}>
          <Input label="Banco *" value={accForm.bank_name} onChange={setA('bank_name')} placeholder="BCP, Interbank, BBVA..." />
          <div className={styles.row}>
            <Input label="Número de cuenta *" value={accForm.account_number} onChange={setA('account_number')} placeholder="0000-00000000-0-00" />
            <Input label="CCI" value={accForm.cci} onChange={setA('cci')} placeholder="00200000000000000000" />
          </div>
          {accError && <p className={styles.error}>{accError}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setAccModal(false)}>Cancelar</Button>
            <Button loading={accSaving} onClick={saveAccount}>{editingAcc ? 'Guardar' : 'Crear cuenta'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal movimientos */}
      <Modal open={movModal} onClose={() => setMovModal(false)} title="Nuevo movimiento">
        <div className={styles.form}>
          <div className={styles.row}>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <label style={{fontSize:12,fontWeight:500,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.02em'}}>Cuenta *</label>
              <select className={mStyles.nativeSelect} value={movForm.account} onChange={setM('account')}>
                <option value="">— Seleccionar —</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.bank_name} — {a.account_number}</option>)}
              </select>
            </div>
            <Input label="N° movimiento" value={movForm.movement_number} onChange={setM('movement_number')} placeholder="0001" />
          </div>
          <div className={styles.row}>
            <Input label="Fecha de operación *" type="date" value={movForm.operation_date} onChange={setM('operation_date')} />
            <Input label="Fecha valor *" type="date" value={movForm.value_date} onChange={setM('value_date')} />
          </div>
          <Input label="Referencia" value={movForm.reference} onChange={setM('reference')} placeholder="Descripción del movimiento" />
          <div className={styles.row}>
            <Input label="Importe *" type="number" step="0.01" value={movForm.amount} onChange={setM('amount')} placeholder="0.00" />
            <Input label="ITF" type="number" step="0.01" value={movForm.itf} onChange={setM('itf')} placeholder="0.00" />
          </div>
          {movError && <p className={styles.error}>{movError}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setMovModal(false)}>Cancelar</Button>
            <Button loading={movSaving} onClick={saveMovement}>Registrar movimiento</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}