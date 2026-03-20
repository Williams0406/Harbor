'use client'

import { useEffect, useMemo, useState } from 'react'
import api from '@/lib/axios'
import styles from './charts.module.css'

const SVG_WIDTH = 1120
const SVG_HEIGHT = 360
const PADDING = { top: 24, right: 76, bottom: 54, left: 72 }

const SERIES_COLORS = ['#58a6ff', '#3fb950', '#f78166', '#d29922', '#bc8cff', '#ff7b72', '#79c0ff']
const LABEL_POSITION_OPTIONS = {
  line: ['above', 'middle', 'below'],
  bar: ['top', 'center', 'bottom'],
}

function sortReports(list) {
  return list.slice().sort((a, b) => {
    const hourmeterA = Number(a?.hourmeter)
    const hourmeterB = Number(b?.hourmeter)
    const safeA = Number.isFinite(hourmeterA) ? hourmeterA : Number.POSITIVE_INFINITY
    const safeB = Number.isFinite(hourmeterB) ? hourmeterB : Number.POSITIVE_INFINITY
    if (safeA !== safeB) return safeA - safeB
    return String(a?.date || '').localeCompare(String(b?.date || ''))
  })
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildRows(reports) {
  return sortReports(reports)
    .map((report) => ({
      id: report.id,
      date: report.date,
      hourmeter: toNumber(report.hourmeter),
      fish_in_hold: toNumber(report.fish_in_hold),
      knot_speed: toNumber(report.knot_speed),
      ambient_temp_engine_room: toNumber(report.ambient_temp_engine_room),
      intake_air_temp: toNumber(report.intake_air_temp),
      oil_temp_crankcase: toNumber(report.oil_temp_crankcase),
      engine_coolant_temp: toNumber(report.engine_coolant_temp),
      damper_temp: toNumber(report.damper_temp),
      exhaust_pipe_temp: toNumber(report.exhaust_pipe_temp),
      boost_pressure: toNumber(report.boost_pressure),
      coolant_pump_pressure: toNumber(report.coolant_pump_pressure),
      aftercooler_coolant_inlet_temp: toNumber(report.aftercooler_coolant_inlet_temp),
      aftercooler_coolant_outlet_temp: toNumber(report.aftercooler_coolant_outlet_temp),
      liner_coolant_inlet_temp: toNumber(report.liner_coolant_inlet_temp),
      liner_coolant_outlet_temp: toNumber(report.liner_coolant_outlet_temp),
      exhaust_temp_cyl_1: toNumber(report.exhaust_temp_cyl_1),
      exhaust_temp_cyl_2: toNumber(report.exhaust_temp_cyl_2),
      exhaust_temp_cyl_3: toNumber(report.exhaust_temp_cyl_3),
      exhaust_temp_cyl_4: toNumber(report.exhaust_temp_cyl_4),
      exhaust_temp_cyl_5: toNumber(report.exhaust_temp_cyl_5),
      exhaust_temp_cyl_6: toNumber(report.exhaust_temp_cyl_6),
      refill_engine_oil: toNumber(report.refill_engine_oil),
      engine_oil_level: toNumber(report.engine_oil_level),
      oil_pressure: toNumber(report.oil_pressure),
    }))
    .filter((report) => report.hourmeter !== null)
}

function filterCargoRows(rows) {
  let lastFishValue = null
  return rows.filter((row) => {
    if (row.fish_in_hold === null || row.fish_in_hold <= 0) return false
    if (lastFishValue !== null && row.fish_in_hold === lastFishValue) return false
    lastFishValue = row.fish_in_hold
    return true
  })
}

function formatValue(value) {
  if (value === null || value === undefined) return '—'
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, '')
}

function getRange(values, paddingPercent) {
  const numeric = values.filter((value) => value !== null && value !== undefined)
  if (!numeric.length) return { min: 0, max: 1 }

  let min = Math.min(...numeric)
  let max = Math.max(...numeric)
  const hasZero = numeric.some((value) => value === 0)

  if (min === max) {
    const base = Math.abs(max || 1)
    const padding = Math.max(base * (paddingPercent / 100), 1)
    return { min: hasZero ? 0 : min - padding, max: max + padding }
  }

  const padding = (max - min) * (paddingPercent / 100)
  return { min: hasZero ? 0 : min - padding, max: max + padding }
}

function isWithinHourmeterRange(report, hourmeterFrom, hourmeterTo) {
  const hourmeter = report?.hourmeter
  if (hourmeter === null || hourmeter === undefined) return false
  if (hourmeterFrom !== '' && hourmeter < hourmeterFrom) return false
  if (hourmeterTo !== '' && hourmeter > hourmeterTo) return false
  return true
}

async function fetchAllReports() {
  let nextUrl = '/reports/'
  const rows = []

  while (nextUrl) {
    const res = await api.get(nextUrl)
    const payload = res.data
    const batch = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : [])
    rows.push(...batch)

    const next = payload?.next
    if (!next) {
      nextUrl = null
      continue
    }

    if (next.startsWith('http')) {
      const parsed = new URL(next)
      nextUrl = parsed.pathname.includes('/api/') ? `${parsed.pathname.slice(parsed.pathname.indexOf('/api/') + 4)}${parsed.search}` : `${parsed.pathname}${parsed.search}`
      continue
    }

    nextUrl = next.startsWith('/api/') ? next.slice(4) : next
  }

  return rows
}

function getLineLabelY(y, position) {
  if (position === 'middle') return y + 4
  if (position === 'below') return y + 16
  return y - 10
}

function getBarLabelY(y, height, position) {
  if (position === 'center') return y + height / 2 + 4
  if (position === 'bottom') return y + height - 6
  return y - 8
}

function ChartCard({ title, note, rows, series, paddingPercent, labelConfig, selected, onSelect }) {
  const axisPadding = { ...PADDING, bottom: rows.length > 40 ? 118 : PADDING.bottom }
  const xLabelY = SVG_HEIGHT - axisPadding.bottom + 22
  const plotWidth = SVG_WIDTH - axisPadding.left - axisPadding.right
  const plotHeight = SVG_HEIGHT - axisPadding.top - axisPadding.bottom
  const primarySeries = series.filter((item) => item.axis !== 'secondary')
  const secondarySeries = series.filter((item) => item.axis === 'secondary')
  const primaryRange = getRange(primarySeries.flatMap((item) => rows.map((row) => row[item.key])).filter((v) => v !== null), paddingPercent)
  const secondaryRange = getRange(secondarySeries.flatMap((item) => rows.map((row) => row[item.key])).filter((v) => v !== null), paddingPercent)

  const projectXByIndex = (index) => {
    if (rows.length <= 1) return axisPadding.left + plotWidth / 2
    return axisPadding.left + (index / (rows.length - 1)) * plotWidth
  }

  const projectY = (value, axis) => {
    const range = axis === 'secondary' ? secondaryRange : primaryRange
    if (range.max === range.min) return axisPadding.top + plotHeight / 2
    return axisPadding.top + plotHeight - ((value - range.min) / (range.max - range.min)) * plotHeight
  }

  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4
    const value = primaryRange.min + (primaryRange.max - primaryRange.min) * ratio
    return { value, y: axisPadding.top + plotHeight - ratio * plotHeight }
  })

  const secondaryTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4
    const value = secondaryRange.min + (secondaryRange.max - secondaryRange.min) * ratio
    return { value, y: axisPadding.top + plotHeight - ratio * plotHeight }
  })

  const barSeriesCount = Math.max(series.filter((item) => item.type === 'bar').length, 1)
  const baseBarWidth = rows.length ? Math.min(42, plotWidth / Math.max(rows.length, 1) / 1.8) : 24

  return (
    <article className={[styles.card, selected ? styles.cardActive : ''].join(' ')} onClick={onSelect}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>{title}</h2>
          {note && <p className={styles.cardNote}>{note}</p>}
        </div>
        <div className={styles.legend}>
          {series.map((item, index) => (
            <span key={item.key} className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: item.color || SERIES_COLORS[index % SERIES_COLORS.length] }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={styles.emptyState}>No hay datos suficientes para este gráfico.</div>
      ) : (
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className={styles.chart} role="img" aria-label={title}>
          <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} rx="16" className={styles.chartBg} />
          {yTicks.map((tick) => (
            <g key={`primary-${tick.y}`}>
              <line x1={axisPadding.left} x2={SVG_WIDTH - axisPadding.right} y1={tick.y} y2={tick.y} className={styles.gridLine} />
              <text x={axisPadding.left - 12} y={tick.y + 4} className={styles.axisLabel} textAnchor="end">{formatValue(tick.value)}</text>
            </g>
          ))}
          {secondarySeries.length > 0 && secondaryTicks.map((tick) => (
            <text key={`secondary-${tick.y}`} x={SVG_WIDTH - axisPadding.right + 12} y={tick.y + 4} className={styles.axisLabel} textAnchor="start">{formatValue(tick.value)}</text>
          ))}
          <line x1={axisPadding.left} x2={axisPadding.left} y1={axisPadding.top} y2={SVG_HEIGHT - axisPadding.bottom} className={styles.axisLine} />
          <line x1={SVG_WIDTH - axisPadding.right} x2={SVG_WIDTH - axisPadding.right} y1={axisPadding.top} y2={SVG_HEIGHT - axisPadding.bottom} className={styles.axisLineSecondary} />
          <line x1={axisPadding.left} x2={SVG_WIDTH - axisPadding.right} y1={SVG_HEIGHT - axisPadding.bottom} y2={SVG_HEIGHT - axisPadding.bottom} className={styles.axisLine} />
          {rows.map((row, index) => {
            const x = projectXByIndex(index)
            return (
              <g key={`tick-${row.id}`}>
                <line x1={x} x2={x} y1={SVG_HEIGHT - axisPadding.bottom} y2={SVG_HEIGHT - axisPadding.bottom + 6} className={styles.axisLine} />
                <text
                  x={x}
                  y={xLabelY}
                  className={styles.axisLabel}
                  textAnchor="middle"
                  transform={rows.length > 40 ? `rotate(-90 ${x} ${xLabelY})` : undefined}
                >
                  {formatValue(row.hourmeter)}
                </text>
              </g>
            )
          })}
          {series.map((item, seriesIndex) => {
            const color = item.color || SERIES_COLORS[seriesIndex % SERIES_COLORS.length]
            if (item.type === 'bar') {
              const barPosition = series.filter((seriesItem) => seriesItem.type === 'bar').findIndex((seriesItem) => seriesItem.key === item.key)
              return rows.map((row, rowIndex) => {
                const value = row[item.key]
                if (value === null) return null
                const x = projectXByIndex(rowIndex) - (baseBarWidth * barSeriesCount) / 2 + barPosition * baseBarWidth
                const y = projectY(value, item.axis)
                const height = SVG_HEIGHT - axisPadding.bottom - y
                return (
                  <g key={`${item.key}-${row.id}`}>
                    <rect x={x} y={y} width={baseBarWidth - 4} height={height} rx="6" fill={color} opacity="0.82" />
                    {labelConfig.enabled && (
                      <text x={x + (baseBarWidth - 4) / 2} y={getBarLabelY(y, height, labelConfig.barPosition)} textAnchor="middle" className={styles.dataLabel}>{formatValue(value)}</text>
                    )}
                  </g>
                )
              })
            }
            const points = rows
              .map((row, rowIndex) => ({ row, rowIndex, value: row[item.key] }))
              .filter((entry) => entry.value !== null)
              .map((entry) => ({
                x: projectXByIndex(entry.rowIndex),
                y: projectY(entry.value, item.axis),
                value: entry.value,
                id: entry.row.id,
              }))
            const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
            return (
              <g key={item.key}>
                {path && <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
                {points.map((point) => (
                  <g key={`${item.key}-${point.id}`}>
                    <circle cx={point.x} cy={point.y} r="2.6" fill={color} className={styles.point} />
                    {labelConfig.enabled && <text x={point.x} y={getLineLabelY(point.y, labelConfig.linePosition)} textAnchor="middle" className={styles.dataLabel}>{formatValue(point.value)}</text>}
                  </g>
                ))}
              </g>
            )
          })}
          <text x={SVG_WIDTH / 2} y={SVG_HEIGHT - 10} className={styles.axisTitle} textAnchor="middle">Horómetro</text>
        </svg>
      )}
    </article>
  )
}


function ChartSettingsModal({ chart, labelConfig, onChange, onClose }) {
  if (!chart) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalKicker}>Configuración del gráfico</p>
            <h2 className={styles.modalTitle}>{chart.title}</h2>
          </div>
          <button className={styles.ghostButton} onClick={onClose}>Cerrar</button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.control}>
            <span>Mostrar etiquetas</span>
            <input
              type="checkbox"
              checked={labelConfig.enabled}
              onChange={e => onChange({ ...labelConfig, enabled: e.target.checked })}
            />
          </label>
          <label className={styles.control}>
            <span>Posición etiquetas líneas</span>
            <select
              className={styles.select}
              value={labelConfig.linePosition}
              onChange={e => onChange({ ...labelConfig, linePosition: e.target.value })}
            >
              {LABEL_POSITION_OPTIONS.line.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className={styles.control}>
            <span>Posición etiquetas barras</span>
            <select
              className={styles.select}
              value={labelConfig.barPosition}
              onChange={e => onChange({ ...labelConfig, barPosition: e.target.value })}
            >
              {LABEL_POSITION_OPTIONS.bar.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}

export default function ReportChartsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [hourmeterFrom, setHourmeterFrom] = useState('')
  const [hourmeterTo, setHourmeterTo] = useState('')
  const [paddingPercent, setPaddingPercent] = useState(20)
  const [labelSettings, setLabelSettings] = useState({})
  const [selectedChartId, setSelectedChartId] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const allReports = await fetchAllReports()
        setReports(buildRows(allReports))
      } catch {
        setReports([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredReports = useMemo(() => reports.filter(report => isWithinHourmeterRange(report, hourmeterFrom === '' ? '' : Number(hourmeterFrom), hourmeterTo === '' ? '' : Number(hourmeterTo))), [reports, hourmeterFrom, hourmeterTo])

  const charts = useMemo(() => {
    const cargoRows = filterCargoRows(filteredReports)
    return [
      {
        id: 'cargo-vs-speed',
        title: 'Relacion carga en bodega en Toneladas vs velocidad en Nudos EP Modesto 7 Motor Mitsubishi S6R2',
        note: 'Nota: No se describen las condiciones del mar',
        rows: cargoRows,
        series: [
          { key: 'fish_in_hold', label: 'Pesca en bodega', type: 'bar', axis: 'primary', color: '#58a6ff', dataLabels: true },
          { key: 'knot_speed', label: 'Velocidad nudos', type: 'line', axis: 'secondary', color: '#f78166' },
        ],
      },
      {
        id: 'operation-temperatures-main',
        title: 'Temperaturas de Operación',
        rows: filteredReports,
        series: [
          { key: 'ambient_temp_engine_room', label: 'Temp. Ambiente sala máquinas', type: 'line', axis: 'primary' },
          { key: 'intake_air_temp', label: 'Temp. Aire admisión', type: 'line', axis: 'primary' },
          { key: 'oil_temp_crankcase', label: 'Temp. Aceite cárter', type: 'line', axis: 'primary' },
          { key: 'engine_coolant_temp', label: 'Temp. Refrigerante motor', type: 'line', axis: 'primary' },
          { key: 'damper_temp', label: 'Temp. Damper', type: 'line', axis: 'primary' },
          { key: 'exhaust_pipe_temp', label: 'Temp. Tubo de escape', type: 'line', axis: 'secondary', color: '#ff7b72' },
        ],
      },
      {
        id: 'boost-vs-aftercooler-pressure',
        title: 'Presión de Aceite y Boost del Turbo',
        rows: filteredReports,
        series: [
          { key: 'boost_pressure', label: 'Presión Boost', type: 'line', axis: 'primary', color: '#58a6ff' },
          { key: 'coolant_pump_pressure', label: 'Presión Bomba Secundaria Aftercooler', type: 'line', axis: 'secondary', color: '#d29922' },
        ],
      },
      {
        id: 'operation-temperatures-cooling',
        title: 'Temperaturas de Operación',
        rows: filteredReports,
        series: [
          { key: 'aftercooler_coolant_inlet_temp', label: 'Temp. Ent. Refrig. Aftercooler', type: 'line', axis: 'primary' },
          { key: 'aftercooler_coolant_outlet_temp', label: 'Temp. Sal. Refrig. Aftercooler', type: 'line', axis: 'primary' },
          { key: 'liner_coolant_inlet_temp', label: 'Temp. Ent. Refrig. a las camisas', type: 'line', axis: 'primary' },
          { key: 'liner_coolant_outlet_temp', label: 'Temp. Sal. Refrig. a las camisas', type: 'line', axis: 'primary' },
        ],
      },
      {
        id: 'exhaust-by-cylinder',
        title: 'Temperatura de escape cilindo por Horas del motor',
        rows: filteredReports,
        series: [
          { key: 'exhaust_temp_cyl_1', label: 'Temp. Escape Cilindo #1', type: 'line', axis: 'primary' },
          { key: 'exhaust_temp_cyl_2', label: 'Temp. Escape Cilindo #2', type: 'line', axis: 'primary' },
          { key: 'exhaust_temp_cyl_3', label: 'Temp. Escape Cilindo #3', type: 'line', axis: 'primary' },
          { key: 'exhaust_temp_cyl_4', label: 'Temp. Escape Cilindo #4', type: 'line', axis: 'primary' },
          { key: 'exhaust_temp_cyl_5', label: 'Temp. Escape Cilindo #5', type: 'line', axis: 'primary' },
          { key: 'exhaust_temp_cyl_6', label: 'Temp. Escape Cilindo #6', type: 'line', axis: 'primary' },
        ],
      },
      {
        id: 'oil-data-by-hourmeter',
        title: 'Datos del aceite por hora del motor',
        rows: filteredReports,
        series: [
          { key: 'refill_engine_oil', label: 'Añadido al motor', type: 'bar', axis: 'primary', color: '#3fb950' },
          { key: 'engine_oil_level', label: 'Nivel aceite motor', type: 'line', axis: 'primary', color: '#79c0ff' },
          { key: 'oil_pressure', label: 'Presión aceite', type: 'line', axis: 'secondary', color: '#f78166' },
        ],
      },
    ]
  }, [filteredReports])

  useEffect(() => {
    setLabelSettings(prev => charts.reduce((acc, chart) => ({
      ...acc,
      [chart.id]: prev[chart.id] || { enabled: false, linePosition: 'above', barPosition: 'top' },
    }), {}))
  }, [charts])

  const selectedChart = charts.find(chart => chart.id === selectedChartId) || null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>EngineReport</p>
          <h1 className={styles.title}>Gráficos de operación del motor</h1>
          <p className={styles.subtitle}>Visualización de métricas generadas desde la tabla `EngineReport` ordenadas por horómetro.</p>
        </div>
        <div className={styles.actions}>
          <a href="/dashboard/report" className={styles.ghostButton}>← Volver a reportes</a>
        </div>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.control}>
          <span>Horómetro desde</span>
          <input
            className={styles.input}
            type="number"
            step="0.1"
            value={hourmeterFrom}
            onChange={e => setHourmeterFrom(e.target.value)}
          />
        </label>
        <label className={styles.control}>
          <span>Horómetro hasta</span>
          <input
            className={styles.input}
            type="number"
            step="0.1"
            value={hourmeterTo}
            onChange={e => setHourmeterTo(e.target.value)}
          />
        </label>
        <label className={styles.control}>
          <span>Margen eje Y (%)</span>
          <input
            className={styles.input}
            type="number"
            min="0"
            step="1"
            value={paddingPercent}
            onChange={e => setPaddingPercent(Math.max(0, Number(e.target.value || 0)))}
          />
        </label>
        <button
          className={styles.ghostButton}
          onClick={() => {
            setHourmeterFrom('')
            setHourmeterTo('')
            setPaddingPercent(20)
          }}
        >
          Restablecer
        </button>
      </div>

      <p className={styles.summary}>Mostrando {filteredReports.length} dato(s) de horómetro en eje X equidistante. Los ejes Y usan un margen configurable de {paddingPercent}%.</p>

      {loading ? (
        <div className={styles.loading}>Cargando gráficos…</div>
      ) : (
        <div className={styles.grid}>
          {charts.map((chart) => (
            <ChartCard
              key={chart.id}
              title={chart.title}
              note={chart.note}
              rows={chart.rows}
              series={chart.series}
              paddingPercent={paddingPercent}
              labelConfig={labelSettings[chart.id] || { enabled: false, linePosition: 'above', barPosition: 'top' }}
              selected={selectedChartId === chart.id}
              onSelect={() => setSelectedChartId(chart.id)}
            />
          ))}
        </div>
      )}

      <ChartSettingsModal
        chart={selectedChart}
        labelConfig={selectedChart ? (labelSettings[selectedChart.id] || { enabled: false, linePosition: 'above', barPosition: 'top' }) : { enabled: false, linePosition: 'above', barPosition: 'top' }}
        onChange={(nextConfig) => {
          if (!selectedChart) return
          setLabelSettings(prev => ({ ...prev, [selectedChart.id]: nextConfig }))
        }}
        onClose={() => setSelectedChartId(null)}
      />
    </div>
  )
}