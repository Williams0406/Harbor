'use client'

import 'handsontable/styles/handsontable.min.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { reportsApi } from '@/lib/api/reports'
import styles from './reports.module.css'

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

const GROUP = {
  General:               { accent: '#2f81f7', cellBg: '#0f1620', selBg: 'rgba(47,129,247,0.07)'  },
  Temperaturas:          { accent: '#d29922', cellBg: '#161208', selBg: 'rgba(210,153,34,0.07)'  },
  'Aceite motor':        { accent: '#f85149', cellBg: '#180e0d', selBg: 'rgba(248,81,73,0.07)'   },
  Refrigeración:         { accent: '#3fb950', cellBg: '#0c1810', selBg: 'rgba(63,185,80,0.07)'   },
  'Escape cilindros':    { accent: '#bc8cff', cellBg: '#130f1e', selBg: 'rgba(188,140,255,0.07)' },
  'Caja de transmisión': { accent: '#58a6ff', cellBg: '#0c1520', selBg: 'rgba(88,166,255,0.07)'  },
}

const FIELDS = [
  { key: 'hourmeter',                       label: 'Horómetro (h)',                group: 'General' },
  { key: 'rpm_speed',                       label: 'Velocidad RPM',                group: 'General' },
  { key: 'knot_speed',                      label: 'Velocidad nudos',              group: 'General' },
  { key: 'fish_in_hold',                    label: 'Pesca en bodega',              group: 'General' },
  { key: 'ambient_temp_engine_room',        label: 'T° amb. sala máq.',            group: 'Temperaturas' },
  { key: 'intake_air_temp',                 label: 'T° aire admisión',             group: 'Temperaturas' },
  { key: 'exhaust_pipe_temp',               label: 'T° tubo escape',               group: 'Temperaturas' },
  { key: 'oil_pressure',                    label: 'Presión aceite',               group: 'Temperaturas' },
  { key: 'oil_temp_crankcase',              label: 'T° aceite cárter',             group: 'Temperaturas' },
  { key: 'engine_coolant_temp',             label: 'T° refrigerante motor',        group: 'Temperaturas' },
  { key: 'damper_temp',                     label: 'T° damper',                    group: 'Temperaturas' },
  { key: 'boost_pressure',                  label: 'Presión boots',                group: 'Temperaturas' },
  { key: 'engine_oil_level',                label: 'Nivel aceite motor',           group: 'Aceite motor' },
  { key: 'refill_engine_oil',               label: 'Rellenar aceite  0=No  1=Sí',  group: 'Aceite motor' },
  { key: 'coolant_pump_pressure',           label: 'Presión bomba refrig.',        group: 'Refrigeración' },
  { key: 'aftercooler_coolant_inlet_temp',  label: 'Aftercooler entrada',          group: 'Refrigeración' },
  { key: 'aftercooler_coolant_outlet_temp', label: 'Aftercooler salida',           group: 'Refrigeración' },
  { key: 'liner_coolant_inlet_temp',        label: 'Camisas entrada',              group: 'Refrigeración' },
  { key: 'liner_coolant_outlet_temp',       label: 'Camisas salida',               group: 'Refrigeración' },
  { key: 'gearbox_coolant_inlet_temp',      label: 'Caja transm. entrada',         group: 'Refrigeración' },
  { key: 'gearbox_coolant_outlet_temp',     label: 'Caja transm. salida',          group: 'Refrigeración' },
  { key: 'exhaust_temp_cyl_1',              label: 'Escape cilindro #1',           group: 'Escape cilindros' },
  { key: 'exhaust_temp_cyl_2',              label: 'Escape cilindro #2',           group: 'Escape cilindros' },
  { key: 'exhaust_temp_cyl_3',              label: 'Escape cilindro #3',           group: 'Escape cilindros' },
  { key: 'exhaust_temp_cyl_4',              label: 'Escape cilindro #4',           group: 'Escape cilindros' },
  { key: 'exhaust_temp_cyl_5',              label: 'Escape cilindro #5',           group: 'Escape cilindros' },
  { key: 'exhaust_temp_cyl_6',              label: 'Escape cilindro #6',           group: 'Escape cilindros' },
  { key: 'gearbox_oil_pressure',            label: 'Presión aceite caja transm.',  group: 'Caja de transmisión' },
  { key: 'gearbox_oil_temp',                label: 'T° aceite caja transm.',       group: 'Caja de transmisión' },
]

const COL_WIDTH      = 140
const ROW_HDR_WIDTH  = 220
const ROW_HEIGHT     = 30

function getHourmeterSortValue(report) {
  const raw = report?.hourmeter
  if (raw === null || raw === undefined || raw === '') return Number.POSITIVE_INFINITY
  const value = Number(raw)
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY
}

function sortReports(list) {
  return list.slice().sort((a, b) => {
    const hourmeterDiff = getHourmeterSortValue(a) - getHourmeterSortValue(b)
    if (hourmeterDiff !== 0) return hourmeterDiff

    if ((a?.date || '') !== (b?.date || '')) return (a?.date || '').localeCompare(b?.date || '')
    return (a?.id || 0) - (b?.id || 0)
  })
}

function buildMatrix(reports) {
  return FIELDS.map(f =>
    reports.map(r => {
      const v = r[f.key]
      return v === null || v === undefined || v === '' ? null : Number(v)
    })
  )
}

function areSameColumns(a, b) {
  if (a === b) return true
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

function isWithinDateRange(report, dateFrom, dateTo) {
  const date = report?.date || ''
  if (!date) return !dateFrom && !dateTo
  if (dateFrom && date < dateFrom) return false
  if (dateTo && date > dateTo) return false
  return true
}

// ─── Sync Handsontable data without destroy/recreate ────────────────────────
function syncHot(hot, reports) {
  if (!hot || hot.isDestroyed) return
  const headers = reports.map(r => r.date ?? '—')
  const matrix  = buildMatrix(reports)
  const safeData = matrix.length && matrix[0].length ? matrix : [[]]
  const visibleCols = Math.max(headers.length, 1)

  hot.updateSettings({
    colHeaders: headers.length ? headers : ['—'],
    data: safeData,
    width: ROW_HDR_WIDTH + visibleCols * COL_WIDTH + 2,
    height: FIELDS.length * ROW_HEIGHT + 34,
  }, false)
  hot.render()
}

// ─── Date modal ──────────────────────────────────────────────────────────────
function DateModal({ date, onSave, onClose }) {
  const [val, setVal] = useState(date ?? '')
  const onKey = e => {
    if (e.key === 'Enter')  onSave(val)
    if (e.key === 'Escape') onClose()
  }
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalAccent} />
          <p className={styles.modalTitle}>Editar fecha del reporte</p>
        </div>
        <input
          className={styles.modalInput}
          type="date"
          value={val}
          autoFocus
          onChange={e => setVal(e.target.value)}
          onKeyDown={onKey}
        />
        <div className={styles.modalFoot}>
          <button className={styles.btnGhost}   onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={() => onSave(val)} disabled={!val}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Handsontable grid ───────────────────────────────────────────────────────
function HotGrid({ reports, selectedColumn, selectedColumns, onCellChange, onHeaderClick, onColumnSelect, onAddColumn }) {
  const viewportRef      = useRef(null)
  const containerRef     = useRef(null)
  const hotRef           = useRef(null)
  const reportsRef       = useRef(reports)
  const selectedColRef   = useRef(selectedColumn)
  const selectedColsRef  = useRef(selectedColumns)
  // Track which cells are currently "selection-highlighted" so we can clear them
  const selectionCellsRef = useRef([])
  const tableMetrics = useMemo(() => ({
    width: ROW_HDR_WIDTH + Math.max(reports.length, 1) * COL_WIDTH + 2,
    height: FIELDS.length * ROW_HEIGHT + 34,
  }), [reports.length])

  useEffect(() => { reportsRef.current   = reports       }, [reports])
  useEffect(() => { selectedColRef.current = selectedColumn }, [selectedColumn])
  useEffect(() => { selectedColsRef.current = selectedColumns }, [selectedColumns])

  // ── Mount Handsontable once ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || hotRef.current) return

    let cancelled = false
    const container = containerRef.current
    container.replaceChildren()

    Promise.all([
      import('handsontable/registry'),
      import('handsontable'),
    ]).then(([{ registerAllModules }, { default: Handsontable }]) => {
      if (cancelled) return

      registerAllModules()
      container.replaceChildren()

      const hot = new Handsontable(container, {
        data: [[]],
        rowHeaders: FIELDS.map(f => f.label),
        colHeaders: ['—'],
        rowHeaderWidth: ROW_HDR_WIDTH,
        colWidths: COL_WIDTH,
        rowHeights: ROW_HEIGHT,

        // ── layout / scroll ────────────────────────────────────────────────
        stretchH: 'none',
        height: tableMetrics.height,
        width: tableMetrics.width,
        // Prevent phantom frozen-clone misalignment
        fixedColumnsStart: 0,
        fixedRowsTop: 0,

        licenseKey: 'non-commercial-and-evaluation',

        // ── numeric only ───────────────────────────────────────────────────
        type: 'numeric',
        numericFormat: { pattern: '0.[00]', culture: 'en-US' },
        allowEmpty: true,

        // ── interaction ────────────────────────────────────────────────────
        selectionMode: 'multiple',
        outsideClickDeselects: true,
        fillHandle: { autoInsertRow: false },
        copyPaste: {
          pasteMode: 'overwrite',
          rowsLimit: FIELDS.length,
          columnsLimit: Math.max(reportsRef.current.length, 1),
        },
        undo: true,
        manualColumnResize: true,
        autoWrapRow: false,
        autoWrapCol: false,
        enterMoves: { row: 1, col: 0 },
        tabMoves:   { row: 0, col: 1 },

        // ── Paste clamp — never create rows/cols beyond current bounds ─────
        beforeCreateRow()   { return false },
        beforeCreateCol()    { return false },
        beforePaste(data, coords) {
          const range = coords?.[0]
          if (!range) return

          const maxRows = FIELDS.length - range.startRow
          const maxCols = reportsRef.current.length - range.startCol

          if (maxRows <= 0 || maxCols <= 0) return false

          data.splice(maxRows)
          for (let index = 0; index < data.length; index += 1) {
            data[index] = data[index].slice(0, maxCols).map(value => {
              if (value === null || value === undefined || value === '') return null
              const normalized = String(value).trim().replace(',', '.')
              return normalized === '' || Number.isNaN(Number(normalized)) ? null : normalized
            })
          }
        },

        // ── Context menu ───────────────────────────────────────────────────
        contextMenu: {
          items: {
            add_col: {
              name: '＋ &nbsp; Agregar reporte',
              callback() { onAddColumn() },
            },
            del_col: {
              name: '✕ &nbsp; Eliminar reporte',
              callback(_k, sel) {
                const range = sel?.[0]
                if (!range) return

                const startCol = Math.min(range.start.col, range.end.col)
                const endCol = Math.max(range.start.col, range.end.col)
                const cols = Array.from({ length: endCol - startCol + 1 }, (_, index) => startCol + index)
                const labels = cols
                  .map(col => reportsRef.current[col]?.date)
                  .filter(Boolean)

                if (!labels.length) return
                const msg = labels.length === 1
                  ? `¿Eliminar reporte del ${labels[0]}?`
                  : `¿Eliminar ${labels.length} reportes seleccionados?`
                if (!confirm(msg)) return

                onCellChange('delete', cols)
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

        // ── Selection paint ────────────────────────────────────────────────
        afterSelectionEnd(r1, c1, r2, c2) {
          // Clear previous selection highlights
          selectionCellsRef.current.forEach(({ row, col }) => {
            const td = hot.getCell(row, col)
            if (!td) return
            const field = FIELDS[row]
            const group = field ? GROUP[field.group] : null
            td.style.background = group ? group.cellBg : T.bgSurface
            td.style.boxShadow  = 'none'
          })
          selectionCellsRef.current = []

          const startCol = Math.min(c1, c2)
          const endCol = Math.max(c1, c2)
          const activeCol = c1 === c2 ? c1 : startCol
          const isHeaderSelection = Math.min(r1, r2) === 0 && Math.max(r1, r2) === FIELDS.length - 1
          const selectedCols = isHeaderSelection
            ? Array.from({ length: endCol - startCol + 1 }, (_, index) => startCol + index)
            : []

          if (selectedColRef.current !== activeCol || !areSameColumns(selectedColsRef.current, selectedCols)) {
            onColumnSelect({
              active: activeCol,
              columns: selectedCols,
            })
          }

          for (let row = Math.min(r1, r2); row <= Math.max(r1, r2); row++) {
            for (let col = Math.min(c1, c2); col <= Math.max(c1, c2); col++) {
              const td = hot.getCell(row, col)
              if (!td) continue
              const field = FIELDS[row]
              const group = field ? GROUP[field.group] : null
              td.style.background = group ? group.selBg : T.bgHover
              td.style.boxShadow  = `inset 0 0 0 1px ${group ? group.accent : T.accent}44`
              selectionCellsRef.current.push({ row, col })
            }
          }
        },

        afterDeselect() {
          // Restore all previously-painted selection cells to base color
          selectionCellsRef.current.forEach(({ row, col }) => {
            const td = hot.getCell(row, col)
            if (!td) return
            const field = FIELDS[row]
            const group = field ? GROUP[field.group] : null
            td.style.background = group ? group.cellBg : T.bgSurface
            td.style.boxShadow  = 'none'
          })
          selectionCellsRef.current = []
          if (selectedColRef.current !== null || selectedColsRef.current.length) {
            onColumnSelect({ active: null, columns: [] })
          }
          hot.render()
        },

        // ── Cell changes ───────────────────────────────────────────────────
        afterChange(changes, source) {
          if (!changes || source === 'loadData') return
          onCellChange('cell', changes)
        },

        // ── Row header styling ─────────────────────────────────────────────
        afterGetRowHeader(row, TH) {
          if (!TH) return
          const field = FIELDS[row]
          const group = field ? GROUP[field.group] : null
          const bg    = group ? group.cellBg : T.bgSurface
          const acc   = group ? group.accent : T.border

          TH.style.cssText = `
            background: ${bg};
            border-left: 2px solid ${acc};
            border-right: 1px solid ${T.border};
            border-bottom: 1px solid ${T.borderSubtle};
            font-family: ${T.fontSans};
            font-size: 11px;
            font-weight: 400;
            color: ${T.textPrimary};
            text-align: left;
            padding: 0 10px 0 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: ${ROW_HEIGHT}px;
            max-width: ${ROW_HDR_WIDTH}px;
          `
        },

        // ── Col header styling ─────────────────────────────────────────────
        afterGetColHeader(col, TH) {
          if (!TH || col < 0) return
          const isSelected = selectedColsRef.current.includes(col) || selectedColRef.current === col

          TH.style.cssText = `
            background: ${isSelected ? T.bgHover : T.bgElevated};
            border-bottom: 2px solid ${isSelected ? T.textPrimary : T.accent};
            border-right: 1px solid ${T.border};
            font-family: ${T.fontMono};
            font-size: 11px;
            font-weight: 600;
            color: ${isSelected ? T.textPrimary : T.textSec};
            letter-spacing: 0.06em;
            cursor: pointer;
            padding: 0 10px;
            transition: color 120ms, background 120ms, border-color 120ms;
            user-select: none;
          `
          TH.onclick = e => {
            e.stopPropagation()
            if (e.shiftKey && selectedColsRef.current.length) {
              const anchor = selectedColsRef.current[0]
              hot.selectColumns(Math.min(anchor, col), Math.max(anchor, col))
              return
            }
            hot.selectColumns(col)
          }
          TH.ondblclick = e => {
            e.stopPropagation()
            onHeaderClick(col)
          }
          TH.onmouseenter = () => {
            if (selectedColRef.current === col) return
            TH.style.color      = T.textPrimary
            TH.style.background = T.bgHover
          }
          TH.onmouseleave = () => {
            if (selectedColRef.current === col) return
            TH.style.color      = T.textSec
            TH.style.background = T.bgElevated
          }
        },

        // ── Per-cell renderer ──────────────────────────────────────────────
        cells(row) {
          return {
            type: 'numeric',
            numericFormat: { pattern: '0.[00]', culture: 'en-US' },
            validator(value, callback) {
              if (value === null || value === undefined || value === '') {
                callback(true)
                return
              }
              const normalized = String(value).trim().replace(',', '.')
              callback(normalized !== '' && !Number.isNaN(Number(normalized)))
            },
            allowInvalid: false,
            renderer(hotInstance, TD, r, c, prop, value, cellProperties) {
              Handsontable.renderers.NumericRenderer.call(
                this, hotInstance, TD, r, c, prop, value, cellProperties
              )
              const field     = FIELDS[r]
              const group     = field ? GROUP[field.group] : null
              const baseBg    = group ? group.cellBg : T.bgSurface

              TD.style.background  = baseBg
              TD.style.color       = (value === null || value === undefined || value === '')
                                       ? T.textMuted : T.textPrimary
              TD.style.fontFamily  = T.fontMono
              TD.style.fontSize    = '12px'
              TD.style.borderBottom = `1px solid ${T.borderSubtle}`
              TD.style.borderRight  = `1px solid ${T.borderSubtle}`
              TD.style.padding      = '0 10px'
              TD.style.boxShadow    = 'none'
            },
          }
        },
      })

      hotRef.current = hot
      syncHot(hot, reportsRef.current)
    })

    return () => {
      cancelled = true
      hotRef.current?.destroy()
      hotRef.current = null
      container.replaceChildren()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sync data whenever reports or selectedColumn change ─────────────────
  useEffect(() => {
    syncHot(hotRef.current, reports)
    // Re-render headers to reflect new selectedColumn highlight
    hotRef.current?.render()
  }, [reports, selectedColumn, selectedColumns])

  return (
    <div ref={viewportRef} className={styles.hotViewport}>
      <div
        ref={containerRef}
        className={styles.hotContainer}
        style={{ width: `${tableMetrics.width}px`, height: `${tableMetrics.height}px` }}
      />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
function normalizeNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const normalized = String(value).trim().replace(',', '.')
  if (normalized === '') return null
  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

export default function ReportsPage() {
  const reportsRef = useRef([])
  const visibleReportsRef = useRef([])
  const [reports,       setReports]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [creating,      setCreating]      = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [errMsg,        setErrMsg]        = useState('')
  const [dateModal,     setDateModal]     = useState(null)
  const [selectedColumn, setSelectedColumn] = useState(null)
  const [selectedColumns, setSelectedColumns] = useState([])
  const [dateFrom,      setDateFrom]      = useState('')
  const [dateTo,        setDateTo]        = useState('')

  useEffect(() => { reportsRef.current = reports }, [reports])

  const visibleReports = useMemo(() => (
    reports.filter(report => isWithinDateRange(report, dateFrom, dateTo))
  ), [reports, dateFrom, dateTo])

  useEffect(() => { visibleReportsRef.current = visibleReports }, [visibleReports])
  useEffect(() => {
    setSelectedColumn(null)
    setSelectedColumns([])
  }, [dateFrom, dateTo])

  // ── Load ─────────────────────────────────────────────────────────────────
  const load = useCallback(async (keepLoadingState = true) => {
    if (keepLoadingState) setLoading(true)
    try {
      const res  = await reportsApi.getReports()
      const list = sortReports(res.data.results ?? res.data)
      setReports(list)
    } catch {
      setReports([])
    } finally {
      if (keepLoadingState) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function flash(msg) {
    setErrMsg(msg)
    setTimeout(() => setErrMsg(''), 3500)
  }

  // ── Add report ───────────────────────────────────────────────────────────
  async function handleNewReport() {
    setCreating(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res   = await reportsApi.createReport({ date: today })
      const next  = sortReports([...reportsRef.current, res.data])
      const nextVisible = next.filter(report => isWithinDateRange(report, dateFrom, dateTo))
      setReports(next)
      const nextIndex = nextVisible.findIndex(r => r.id === res.data.id)
      setSelectedColumn(nextIndex >= 0 ? nextIndex : null)
      await load(false)
    } catch (e) {
      flash(e.response?.data?.date?.[0] || 'Error al crear reporte')
    } finally {
      setCreating(false)
    }
  }

  // ── Delete column ─────────────────────────────────────────────────────────
  const handleDeleteColumn = useCallback(async (cols) => {
    const indexes = [...new Set((Array.isArray(cols) ? cols : [cols]).filter(Number.isInteger))].sort((a, b) => a - b)
    const reportsToDelete = indexes.map(index => visibleReportsRef.current[index]).filter(Boolean)
    if (!reportsToDelete.length) return

    const idsToDelete = new Set(reportsToDelete.map(report => report.id))
    const next = reportsRef.current.filter(report => !idsToDelete.has(report.id))

    setReports(next)
    setSelectedColumn(null)
    setSelectedColumns([])

    try {
      await Promise.all(reportsToDelete.map(report => reportsApi.deleteReport(report.id)))
      await load(false)
    } catch {
      setReports(sortReports([...next, ...reportsToDelete]))
      flash(reportsToDelete.length > 1 ? 'Error al eliminar columnas' : 'Error al eliminar')
    }
  }, [load])

  // ── Cell change / delete dispatch ─────────────────────────────────────────
  const handleCellChange = useCallback(async (type, payload) => {
    if (type === 'delete') {
      await handleDeleteColumn(payload)
      return
    }
    if (type === 'cell') {
      for (const [row, col, oldVal, newVal] of payload) {
        const report = visibleReportsRef.current[col]
        const field  = FIELDS[row]
        if (!report || !field) continue

        // Numeric-only guard
        const parsed = normalizeNumber(newVal)
        if (newVal !== null && newVal !== '' && parsed === null) continue

        const prev = normalizeNumber(oldVal)
        if (parsed === prev) continue

        setReports(p => p.map(r => r.id === report.id ? { ...r, [field.key]: parsed } : r))
        setSaving(true)
        try {
          await reportsApi.patchReport(report.id, { [field.key]: parsed })
          await load(false)
        } catch {
          setReports(p => p.map(r => r.id === report.id ? { ...r, [field.key]: prev } : r))
          flash('Error al guardar')
        } finally {
          setSaving(false)
        }
      }
    }
  }, [handleDeleteColumn])

  // ── Header click → open date modal ───────────────────────────────────────
  const handleHeaderClick = useCallback((col) => {
    const report = visibleReportsRef.current[col]
    if (!report) return
    setSelectedColumn(col)
    setDateModal({ col, reportId: report.id, date: report.date })
  }, [])

  // ── Save date ─────────────────────────────────────────────────────────────
  async function handleDateSave(newDate) {
    const { reportId, date: oldDate } = dateModal
    setDateModal(null)
    if (!newDate || newDate === oldDate) return

    const optimistic = sortReports(reportsRef.current.map(r =>
      r.id === reportId ? { ...r, date: newDate } : r
    ))
    const rollback = sortReports(reportsRef.current.map(r =>
      r.id === reportId ? { ...r, date: oldDate } : r
    ))

    const optimisticVisible = optimistic.filter(report => isWithinDateRange(report, dateFrom, dateTo))
    setReports(optimistic)
    const optimisticIndex = optimisticVisible.findIndex(r => r.id === reportId)
    setSelectedColumn(optimisticIndex >= 0 ? optimisticIndex : null)

    try {
      await reportsApi.patchReport(reportId, { date: newDate })
      await load(false)
    } catch {
      const rollbackVisible = rollback.filter(report => isWithinDateRange(report, dateFrom, dateTo))
      setReports(rollback)
      const rollbackIndex = rollbackVisible.findIndex(r => r.id === reportId)
      setSelectedColumn(rollbackIndex >= 0 ? rollbackIndex : null)
      flash('Error al guardar fecha')
    }
  }

  const handleColumnSelect = useCallback(({ active, columns }) => {
    setSelectedColumn(prev => (prev === active ? prev : active))
    setSelectedColumns(prev => (areSameColumns(prev, columns) ? prev : columns))
  }, [])

  const selectedReport = selectedColumn === null ? null : visibleReports[selectedColumn]
  const hasReports = reports.length > 0
  const hasVisibleReports = visibleReports.length > 0
  const selectedCount = selectedColumns.length

  return (
    <div className={styles.page}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Reportes de Motor</h1>
          <span className={styles.subtitle}>
            {hasVisibleReports ? `${visibleReports.length}/${reports.length}` : reports.length} reporte{reports.length !== 1 ? 's' : ''} · {FIELDS.length} campos
          </span>
        </div>
        <div className={styles.headerRight}>
          <a href="/dashboard/report/charts" className={styles.btnSecondary}>
            Ver gráficos
          </a>
          {saving && (
            <span className={styles.pill} data-variant="saving">
              <span className={styles.dot} />
              Guardando…
            </span>
          )}
          {errMsg && (
            <span className={styles.pill} data-variant="error">{errMsg}</span>
          )}
          <div className={styles.filterBar}>
            <label className={styles.filterField}>
              <span>Desde</span>
              <input
                className={styles.filterInput}
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </label>
            <label className={styles.filterField}>
              <span>Hasta</span>
              <input
                className={styles.filterInput}
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </label>
            <button
              className={styles.btnGhost}
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
              disabled={!dateFrom && !dateTo}
            >
              Limpiar filtro
            </button>
          </div>
          {/* Only shown when there are no reports yet */}
          {!hasReports && !loading && (
            <button className={styles.btnSecondary} onClick={handleNewReport} disabled={creating}>
              {creating && <span className={styles.spinner} />}
              + Agregar columna
            </button>
          )}
          {/* Always shown when there ARE reports */}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      {hasVisibleReports && (
        <div className={styles.legend}>
          {Object.entries(GROUP).map(([name, { accent }]) => (
            <span key={name} className={styles.chip}>
              <span className={styles.chipDot} style={{ background: accent }} />
              {name}
            </span>
          ))}
          <span className={styles.hint}>
            Doble clic en la fecha para editar · Columnas ordenadas por horómetro
          </span>
        </div>
      )}

      {/* ── Selection bar ─────────────────────────────────────────────────── */}
      {hasVisibleReports && (
        <div className={styles.selectionBar}>
          <div>
            <p className={styles.selectionLabel}>Columna activa</p>
            <strong className={styles.selectionValue}>
              {selectedCount > 1
                ? `${selectedCount} columnas seleccionadas`
                : (selectedReport?.date ?? 'Selecciona una columna')}
            </strong>
          </div>
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className={styles.body}>
        {loading ? (
          <div className={styles.stateCenter}>
            <span className={styles.spinnerLg} />
            <span className={styles.stateText}>Cargando reportes…</span>
          </div>
        ) : !hasReports ? (
          <div className={styles.stateCenter}>
            <span className={styles.emptyGlyph}>▤</span>
            <p className={styles.emptyTitle}>Sin reportes</p>
            <p className={styles.emptyDesc}>
              Haz clic en <strong>+ Nuevo Reporte</strong> para crear la tabla.
            </p>
            <button className={styles.btnPrimary} onClick={handleNewReport} disabled={creating}>
              {creating && <span className={styles.spinner} />}
              + Nuevo Reporte
            </button>
          </div>
        ) : !hasVisibleReports ? (
          <div className={styles.stateCenter}>
            <span className={styles.emptyGlyph}>◌</span>
            <p className={styles.emptyTitle}>Sin resultados</p>
            <p className={styles.emptyDesc}>
              No hay reportes dentro del rango de fechas seleccionado.
            </p>
            <button className={styles.btnGhost} onClick={() => { setDateFrom(''); setDateTo('') }}>
              Limpiar filtro
            </button>
          </div>
        ) : (
          <div className={styles.tableArea}>
            <HotGrid
              reports={visibleReports}
              selectedColumn={selectedColumn}
              onCellChange={handleCellChange}
              onHeaderClick={handleHeaderClick}
              selectedColumns={selectedColumns}
              onColumnSelect={handleColumnSelect}
              onAddColumn={handleNewReport}
            />
          </div>
        )}
      </div>

      {/* ── Date modal ────────────────────────────────────────────────────── */}
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