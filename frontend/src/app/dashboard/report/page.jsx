'use client'

import 'handsontable/styles/handsontable.min.css'
import { useState, useEffect, useCallback, useRef } from 'react'
import { reportsApi } from '@/lib/api/reports'
import styles from './reports.module.css'

// ── Design tokens — espejo de globals.css ─────────────────────────────────────
const T = {
  bgBase:       '#0d1117',
  bgSurface:    '#161b22',
  bgElevated:   '#1c2330',
  bgHover:      '#21262d',
  border:       '#30363d',
  borderSubtle: '#21262d',
  textPrimary:  '#e6edf3',
  textSec:      '#8b949e',
  textMuted:    '#484f58',
  accent:       '#2f81f7',
  danger:       '#f85149',
  fontSans:     "'DM Sans', sans-serif",
  fontMono:     "'DM Mono', monospace",
}

// ── Grupos: cada uno con bg de celda, bg de selección y acento de borde ───────
const GROUP = {
  'General':             { accent: '#2f81f7', cellBg: '#0f1620', selBg: '#162035' },
  'Temperaturas':        { accent: '#d29922', cellBg: '#161208', selBg: '#2a2010' },
  'Aceite motor':        { accent: '#f85149', cellBg: '#180e0d', selBg: '#2a1210' },
  'Refrigeración':       { accent: '#3fb950', cellBg: '#0c1810', selBg: '#122518' },
  'Escape cilindros':    { accent: '#bc8cff', cellBg: '#130f1e', selBg: '#1e1430' },
  'Caja de transmisión': { accent: '#58a6ff', cellBg: '#0c1520', selBg: '#0f2035' },
}

// ── Campos del motor ──────────────────────────────────────────────────────────
const FIELDS = [
  { key: 'hourmeter',                       label: 'Horómetro (h)',                group: 'General'              },
  { key: 'rpm_speed',                       label: 'Velocidad RPM',                group: 'General'              },
  { key: 'knot_speed',                      label: 'Velocidad nudos',              group: 'General'              },
  { key: 'fish_in_hold',                    label: 'Pesca en bodega',              group: 'General'              },
  { key: 'ambient_temp_engine_room',        label: 'T° amb. sala máq.',            group: 'Temperaturas'         },
  { key: 'intake_air_temp',                 label: 'T° aire admisión',             group: 'Temperaturas'         },
  { key: 'exhaust_pipe_temp',               label: 'T° tubo escape',               group: 'Temperaturas'         },
  { key: 'oil_pressure',                    label: 'Presión aceite',               group: 'Temperaturas'         },
  { key: 'oil_temp_crankcase',              label: 'T° aceite cárter',             group: 'Temperaturas'         },
  { key: 'engine_coolant_temp',             label: 'T° refrigerante motor',        group: 'Temperaturas'         },
  { key: 'damper_temp',                     label: 'T° damper',                    group: 'Temperaturas'         },
  { key: 'boost_pressure',                  label: 'Presión boots',                group: 'Temperaturas'         },
  { key: 'engine_oil_level',                label: 'Nivel aceite motor',           group: 'Aceite motor'         },
  { key: 'refill_engine_oil',               label: 'Rellenar aceite  0=No  1=Sí',  group: 'Aceite motor'         },
  { key: 'coolant_pump_pressure',           label: 'Presión bomba refrig.',        group: 'Refrigeración'        },
  { key: 'aftercooler_coolant_inlet_temp',  label: 'Aftercooler entrada',          group: 'Refrigeración'        },
  { key: 'aftercooler_coolant_outlet_temp', label: 'Aftercooler salida',           group: 'Refrigeración'        },
  { key: 'liner_coolant_inlet_temp',        label: 'Camisas entrada',              group: 'Refrigeración'        },
  { key: 'liner_coolant_outlet_temp',       label: 'Camisas salida',               group: 'Refrigeración'        },
  { key: 'gearbox_coolant_inlet_temp',      label: 'Caja transm. entrada',         group: 'Refrigeración'        },
  { key: 'gearbox_coolant_outlet_temp',     label: 'Caja transm. salida',          group: 'Refrigeración'        },
  { key: 'exhaust_temp_cyl_1',              label: 'Escape cilindro #1',           group: 'Escape cilindros'     },
  { key: 'exhaust_temp_cyl_2',              label: 'Escape cilindro #2',           group: 'Escape cilindros'     },
  { key: 'exhaust_temp_cyl_3',              label: 'Escape cilindro #3',           group: 'Escape cilindros'     },
  { key: 'exhaust_temp_cyl_4',              label: 'Escape cilindro #4',           group: 'Escape cilindros'     },
  { key: 'exhaust_temp_cyl_5',              label: 'Escape cilindro #5',           group: 'Escape cilindros'     },
  { key: 'exhaust_temp_cyl_6',              label: 'Escape cilindro #6',           group: 'Escape cilindros'     },
  { key: 'gearbox_oil_pressure',            label: 'Presión aceite caja transm.',  group: 'Caja de transmisión'  },
  { key: 'gearbox_oil_temp',                label: 'T° aceite caja transm.',       group: 'Caja de transmisión'  },
]

// Ancho fijo de columna de datos — sin stretchH para que no se corten
const COL_WIDTH     = 140
const ROW_HDR_WIDTH = 218
const ROW_HEIGHT    = 30

function buildMatrix(reports) {
  return FIELDS.map(f =>
    reports.map(r => {
      const v = r[f.key]
      return (v === null || v === undefined || v === '') ? null : Number(v)
    })
  )
}

function syncHot(hot, reports) {
  if (!hot || hot.isDestroyed) return
  const headers = reports.map(r => r.date ?? '—')
  hot.updateSettings({ colHeaders: headers.length ? headers : ['—'] }, false)
  const m = buildMatrix(reports)
  hot.loadData(m.length && m[0].length ? m : [[]])
}

// ── Modal de fecha ────────────────────────────────────────────────────────────
function DateModal({ date, onSave, onClose }) {
  const [val, setVal] = useState(date ?? '')
  const onKey = e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onClose() }
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalAccent} />
          <p className={styles.modalTitle}>Editar fecha del reporte</p>
        </div>
        <input
          className={styles.modalInput}
          type="date" value={val} autoFocus
          onChange={e => setVal(e.target.value)}
          onKeyDown={onKey}
        />
        <div className={styles.modalFoot}>
          <button className={styles.btnGhost} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={() => onSave(val)} disabled={!val}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ── Handsontable grid ─────────────────────────────────────────────────────────
function HotGrid({ reports, onCellChange, onHeaderClick }) {
  const containerRef = useRef(null)
  const hotRef       = useRef(null)
  const reportsRef   = useRef(reports)
  useEffect(() => { reportsRef.current = reports }, [reports])

  // Montar una sola vez
  useEffect(() => {
    if (!containerRef.current || hotRef.current) return

    Promise.all([
      import('handsontable/registry'),
      import('handsontable'),
    ]).then(([{ registerAllModules }, { default: Handsontable }]) => {
      registerAllModules()

      const hot = new Handsontable(containerRef.current, {
        data:            [[]],
        rowHeaders:      FIELDS.map(f => f.label),
        colHeaders:      ['—'],
        rowHeaderWidth:  ROW_HDR_WIDTH,
        colWidths:       COL_WIDTH,
        rowHeights:      ROW_HEIGHT,
        // Sin stretchH — cada columna tiene ancho fijo, scroll horizontal al final
        stretchH:        'none',
        height:          '100%',
        width:           '100%',
        licenseKey:      'non-commercial-and-evaluation',

        type:            'numeric',
        numericFormat:   { pattern: '0.[00]', culture: 'en-US' },
        allowEmpty:      true,

        selectionMode:         'multiple',
        outsideClickDeselects: false,
        fillHandle:            { autoInsertRow: false },
        copyPaste:             true,
        undo:                  true,
        manualColumnResize:    true,
        autoWrapRow:           false,
        autoWrapCol:           false,
        enterMoves:            { row: 1, col: 0 },
        tabMoves:              { row: 0, col: 1 },

        contextMenu: {
          items: {
            del_col: {
              name: '✕ &nbsp; Eliminar reporte',
              callback(_k, sel) {
                const col    = sel[0].start.col
                const report = reportsRef.current[col]
                if (!report) return
                if (!confirm(`¿Eliminar reporte del ${report.date}?`)) return
                onCellChange('delete', col, null)
              },
            },
            sep1:  { name: '---------' },
            copy:  { key: 'copy',  name: 'Copiar'   },
            paste: { key: 'paste', name: 'Pegar'    },
            sep2:  { name: '---------' },
            undo:  { key: 'undo',  name: 'Deshacer' },
            redo:  { key: 'redo',  name: 'Rehacer'  },
          },
        },

        afterChange(changes, source) {
          if (!changes || source === 'loadData') return
          onCellChange('cell', changes, null)
        },

        // ── Row header: mismo fondo que las celdas del grupo, texto normal ────
        afterGetRowHeader(row, TH) {
          if (!TH) return
          const field = FIELDS[row]
          const g     = field ? GROUP[field.group] : null
          const bg    = g ? g.cellBg : T.bgSurface
          const acc   = g ? g.accent : T.border

          TH.style.cssText = `
            background: ${bg};
            border-left: 2px solid ${acc};
            border-right: 1px solid ${T.border};
            border-bottom: 1px solid ${T.borderSubtle};
            font-family: ${T.fontSans};
            font-size: 12px;
            font-weight: 400;
            color: ${T.textSec};
            text-align: left;
            padding: 0 12px 0 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: ${ROW_HDR_WIDTH}px;
          `
        },

        // ── Col header: fecha con estilo refinado, click para editar ─────────
        afterGetColHeader(col, TH) {
          if (!TH || col < 0) return
          TH.style.cssText = `
            background: ${T.bgElevated};
            border-bottom: 2px solid ${T.accent};
            border-right: 1px solid ${T.border};
            font-family: ${T.fontMono};
            font-size: 11px;
            font-weight: 600;
            color: ${T.textSec};
            letter-spacing: 0.06em;
            cursor: pointer;
            padding: 0 10px;
            transition: color 120ms, background 120ms;
          `
          TH.onclick      = e => { e.stopPropagation(); onHeaderClick(col) }
          TH.onmouseenter = () => { TH.style.color = T.textPrimary; TH.style.background = T.bgHover }
          TH.onmouseleave = () => { TH.style.color = T.textSec;     TH.style.background = T.bgElevated }
        },

        // ── Renderer: fondo de grupo en celdas, alineado con row header ──────
        cells(row) {
          const field = FIELDS[row]
          const g     = field ? GROUP[field.group] : null
          return {
            type:         'numeric',
            numericFormat: { pattern: '0.[00]', culture: 'en-US' },
            renderer(hotInstance, TD, r, c, prop, value, cellProperties) {
              // Llamar renderer numérico base
              Handsontable.renderers.NumericRenderer.call(
                this, hotInstance, TD, r, c, prop, value, cellProperties
              )
              // Fondo de grupo
              TD.style.background  = g ? g.cellBg : T.bgSurface
              TD.style.color       = T.textPrimary
              TD.style.fontFamily  = T.fontMono
              TD.style.fontSize    = '12px'
              TD.style.borderBottom = `1px solid ${T.borderSubtle}`
              TD.style.borderRight  = `1px solid ${T.borderSubtle}`
              TD.style.padding      = '0 10px'
              // Celda vacía — color tenue
              if (value === null || value === undefined || value === '') {
                TD.style.color = T.textMuted
              }
            },
          }
        },

        // ── Selección: colorear por grupo del row seleccionado ───────────────
        afterSelectionEnd(r1, c1, r2, c2) {
          // Recorrer cada celda en la selección y aplicar selBg del grupo
          for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
            for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
              const td = hot.getCell(r, c)
              if (!td) continue
              const field  = FIELDS[r]
              const g      = field ? GROUP[field.group] : null
              td.style.background = g ? g.selBg : T.bgHover
            }
          }
        },

        // Al deseleccionar — restaurar fondo de grupo
        afterDeselect() {
          hot.render()
        },
      })

      hotRef.current = hot
      syncHot(hot, reportsRef.current)
    })

    return () => { hotRef.current?.destroy(); hotRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sincronizar datos cuando cambien los reports
  useEffect(() => { syncHot(hotRef.current, reports) }, [reports])

  return <div ref={containerRef} className={styles.hotContainer} />
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const reportsRef = useRef([])
  const [reports,   setReports]  = useState([])
  const [loading,   setLoading]  = useState(true)
  const [creating,  setCreating] = useState(false)
  const [saving,    setSaving]   = useState(false)
  const [errMsg,    setErrMsg]   = useState('')
  const [dateModal, setDateModal] = useState(null)

  useEffect(() => { reportsRef.current = reports }, [reports])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await reportsApi.getReports()
      const list = (res.data.results ?? res.data)
        .slice().sort((a, b) => a.date > b.date ? 1 : -1)
      setReports(list)
    } catch { setReports([]) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function flash(msg) { setErrMsg(msg); setTimeout(() => setErrMsg(''), 3500) }

  async function handleNewReport() {
    setCreating(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res   = await reportsApi.createReport({ date: today })
      setReports(prev => [...prev, res.data].sort((a, b) => a.date > b.date ? 1 : -1))
    } catch (e) {
      flash(e.response?.data?.date?.[0] || 'Error al crear reporte')
    } finally { setCreating(false) }
  }

  const handleCellChange = useCallback(async (type, payload) => {
    if (type === 'delete') {
      const col    = payload
      const report = reportsRef.current[col]
      if (!report) return
      setReports(prev => prev.filter(r => r.id !== report.id))
      try { await reportsApi.deleteReport(report.id) }
      catch {
        setReports(prev => [...prev, report].sort((a, b) => a.date > b.date ? 1 : -1))
        flash('Error al eliminar')
      }
      return
    }
    if (type === 'cell') {
      for (const [row, col, oldVal, newVal] of payload) {
        const report = reportsRef.current[col]
        const field  = FIELDS[row]
        if (!report || !field) continue
        const parsed = (newVal === '' || newVal === null) ? null : Number(newVal)
        const prev   = (oldVal === '' || oldVal === null) ? null : Number(oldVal)
        if (parsed === prev) continue
        setReports(p => p.map(r => r.id === report.id ? { ...r, [field.key]: parsed } : r))
        setSaving(true)
        try { await reportsApi.patchReport(report.id, { [field.key]: parsed }) }
        catch {
          setReports(p => p.map(r => r.id === report.id ? { ...r, [field.key]: prev } : r))
          flash('Error al guardar')
        } finally { setSaving(false) }
      }
    }
  }, [])

  const handleHeaderClick = useCallback((col) => {
    const report = reportsRef.current[col]
    if (!report) return
    setDateModal({ col, reportId: report.id, date: report.date })
  }, [])

  async function handleDateSave(newDate) {
    const { reportId, date: oldDate } = dateModal
    setDateModal(null)
    if (!newDate || newDate === oldDate) return
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, date: newDate } : r))
    try { await reportsApi.patchReport(reportId, { date: newDate }) }
    catch {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, date: oldDate } : r))
      flash('Error al guardar fecha')
    }
  }

  const hasReports = reports.length > 0

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Reportes de Motor</h1>
          <span className={styles.subtitle}>
            {reports.length} reporte{reports.length !== 1 ? 's' : ''} · {FIELDS.length} campos
          </span>
        </div>
        <div className={styles.headerRight}>
          {saving && (
            <span className={styles.pill} data-variant="saving">
              <span className={styles.dot} />
              Guardando
            </span>
          )}
          {errMsg && <span className={styles.pill} data-variant="error">{errMsg}</span>}
          {hasReports
            ? <button className={styles.btnSecondary} onClick={handleNewReport} disabled={creating}>
                {creating && <span className={styles.spinner} />}
                + Agregar columna
              </button>
            : <button className={styles.btnPrimary} onClick={handleNewReport} disabled={creating}>
                {creating && <span className={styles.spinner} />}
                + Nuevo Reporte
              </button>
          }
        </div>
      </div>

      {/* ── Leyenda ── */}
      {hasReports && (
        <div className={styles.legend}>
          {Object.entries(GROUP).map(([name, { accent }]) => (
            <span key={name} className={styles.chip}>
              <span className={styles.chipDot} style={{ background: accent }} />
              {name}
            </span>
          ))}
          <span className={styles.hint}>
            Click en la fecha para editarla · Ctrl+Z deshacer · Clic derecho para opciones
          </span>
        </div>
      )}

      {/* ── Body ── */}
      <div className={styles.body}>
        {loading ? (
          <div className={styles.stateCenter}>
            <span className={styles.spinnerLg} />
            <span className={styles.stateText}>Cargando reportes...</span>
          </div>
        ) : !hasReports ? (
          <div className={styles.stateCenter}>
            <span className={styles.emptyGlyph}>▤</span>
            <p className={styles.emptyTitle}>Sin reportes</p>
            <p className={styles.emptyDesc}>Haz clic en <strong>+ Nuevo Reporte</strong> para crear la tabla.</p>
            <button className={styles.btnPrimary} onClick={handleNewReport} disabled={creating}>
              {creating && <span className={styles.spinner} />}
              + Nuevo Reporte
            </button>
          </div>
        ) : (
          <div className={styles.tableArea}>
            <HotGrid
              reports={reports}
              onCellChange={handleCellChange}
              onHeaderClick={handleHeaderClick}
            />
          </div>
        )}
      </div>

      {dateModal && (
        <DateModal
          date={dateModal.date}
          onSave={handleDateSave}
          onClose={() => setDateModal(null)}
        />
      )}
    </div>
  )
}