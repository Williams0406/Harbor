'use client'

import { useState, useEffect, useCallback } from 'react'
import { reportsApi } from '@/lib/api/reports'
import PageShell from '@/components/ui/PageShell'
import Table     from '@/components/ui/Table'
import Modal     from '@/components/ui/Modal'
import Button    from '@/components/ui/Button'
import Input     from '@/components/ui/Input'
import styles    from '../contacts/contacts.module.css'

const EMPTY = {
  date:'', hourmeter:'', rpm_speed:'', knot_speed:'', fish_in_hold:'',
  ambient_temp_engine_room:'', intake_air_temp:'', exhaust_pipe_temp:'',
  oil_pressure:'', oil_temp_crankcase:'', engine_coolant_temp:'',
  damper_temp:'', boost_pressure:'',
  engine_oil_level:'', refill_engine_oil: false,
  coolant_pump_pressure:'',
  aftercooler_coolant_inlet_temp:'', aftercooler_coolant_outlet_temp:'',
  liner_coolant_inlet_temp:'', liner_coolant_outlet_temp:'',
  gearbox_coolant_inlet_temp:'', gearbox_coolant_outlet_temp:'',
  exhaust_temp_cyl_1:'', exhaust_temp_cyl_2:'', exhaust_temp_cyl_3:'',
  exhaust_temp_cyl_4:'', exhaust_temp_cyl_5:'', exhaust_temp_cyl_6:'',
  gearbox_oil_pressure:'', gearbox_oil_temp:'',
}

function FormSection({ title, children }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <p style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:'1px solid var(--border-subtle)',paddingBottom:6}}>{title}</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{children}</div>
    </div>
  )
}

export default function ReportsPage() {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { const res = await reportsApi.getReports(); setData(res.data.results ?? res.data) }
    catch { setData([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setEditing(null); setForm(EMPTY); setError(''); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    const f = {}
    Object.keys(EMPTY).forEach((k) => { f[k] = row[k] ?? EMPTY[k] })
    setForm(f); setError(''); setModal(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este reporte?')) return
    await reportsApi.deleteReport(id); load()
  }

  async function handleSave() {
    if (!form.date || !form.hourmeter || !form.rpm_speed) { setError('Fecha, horómetro y RPM son requeridos'); return }
    setSaving(true)
    try {
      editing ? await reportsApi.updateReport(editing.id, form) : await reportsApi.createReport(form)
      setModal(false); load()
    } catch { setError('Error al guardar') } finally { setSaving(false) }
  }

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [k]: val })
  }

  const N = (label, key, placeholder='0.00') => (
    <Input key={key} label={label} type="number" step="0.01" value={form[key]} onChange={set(key)} placeholder={placeholder} />
  )

  const columns = [
    { key: 'date',       label: 'Fecha',     width:'110px' },
    { key: 'hourmeter',  label: 'Horómetro', width:'110px', render: (r) => <span className="font-mono">{r.hourmeter}h</span> },
    { key: 'rpm_speed',  label: 'RPM',       width:'90px',  render: (r) => <span className="font-mono">{r.rpm_speed}</span> },
    { key: 'knot_speed', label: 'Nudos',     width:'90px',  render: (r) => <span className="font-mono">{r.knot_speed}</span> },
    { key: 'oil_pressure', label: 'P. Aceite', width:'100px', render: (r) => <span className="font-mono">{r.oil_pressure}</span> },
    { key: 'engine_coolant_temp', label: 'T. Refrigerante', render: (r) => <span className="font-mono">{r.engine_coolant_temp}°</span> },
    { key: 'refill_engine_oil', label: 'Rellenar aceite', width:'110px', render: (r) => r.refill_engine_oil ? <span style={{color:'var(--warning)'}}>⚠ Sí</span> : <span style={{color:'var(--text-muted)'}}>No</span> },
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
      title="Reportes de Motor"
      subtitle={`${data.length} reportes`}
      actions={<Button onClick={openCreate}>+ Nuevo reporte</Button>}
    >
      <Table columns={columns} data={data} loading={loading} emptyMessage="No hay reportes registrados" />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar reporte' : 'Nuevo reporte de motor'} size="xl">
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          <FormSection title="General">
            <Input label="Fecha *"      type="date"   value={form.date}        onChange={set('date')} />
            {N('Horómetro (h) *', 'hourmeter', '1000.0')}
            {N('RPM *',           'rpm_speed', '1800')}
            {N('Nudos',           'knot_speed', '12.5')}
            {N('Pesca en bodega', 'fish_in_hold', '0.00')}
          </FormSection>

          <FormSection title="Temperaturas y presiones principales">
            {N('Temp. ambiente sala máq.', 'ambient_temp_engine_room')}
            {N('Temp. aire admisión',      'intake_air_temp')}
            {N('Temp. tubo escape',        'exhaust_pipe_temp')}
            {N('Presión aceite',           'oil_pressure')}
            {N('Temp. aceite cárter',      'oil_temp_crankcase')}
            {N('Temp. refrigerante motor', 'engine_coolant_temp')}
            {N('Temp. damper',             'damper_temp')}
            {N('Presión boots',            'boost_pressure')}
          </FormSection>

          <FormSection title="Aceite motor">
            {N('Nivel aceite motor', 'engine_oil_level')}
            <div style={{display:'flex',alignItems:'center',gap:10,paddingTop:20}}>
              <input type="checkbox" id="refill" checked={form.refill_engine_oil} onChange={set('refill_engine_oil')} style={{width:16,height:16,accentColor:'var(--accent)',cursor:'pointer'}} />
              <label htmlFor="refill" style={{fontSize:13,color:'var(--text-primary)',cursor:'pointer'}}>Requiere rellenar aceite</label>
            </div>
          </FormSection>

          <FormSection title="Sistema de refrigeración">
            {N('Presión bomba refrig.',      'coolant_pump_pressure')}
            {N('Aftercooler entrada',        'aftercooler_coolant_inlet_temp')}
            {N('Aftercooler salida',         'aftercooler_coolant_outlet_temp')}
            {N('Camisas entrada',            'liner_coolant_inlet_temp')}
            {N('Camisas salida',             'liner_coolant_outlet_temp')}
            {N('Caja transm. refrig. entr.', 'gearbox_coolant_inlet_temp')}
            {N('Caja transm. refrig. sal.',  'gearbox_coolant_outlet_temp')}
          </FormSection>

          <FormSection title="Temperatura escape por cilindro">
            {[1,2,3,4,5,6].map((n) => N(`Cilindro #${n}`, `exhaust_temp_cyl_${n}`))}
          </FormSection>

          <FormSection title="Caja de transmisión">
            {N('Presión aceite caja', 'gearbox_oil_pressure')}
            {N('Temp. aceite caja',   'gearbox_oil_temp')}
          </FormSection>

          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear reporte'}</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}