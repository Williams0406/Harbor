'use client'

import { useEffect, useMemo, useState } from 'react'
import PageShell from '@/components/ui/PageShell'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { TABLE_OPTIONS, dataTransferApi } from '@/lib/api/dataTransfer'
import styles from './page.module.css'

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV (.csv)' },
  { value: 'xls', label: 'Excel (.xls)' },
]

function escapeCsvCell(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) return `"${text.replaceAll('"', '""')}"`
  return text
}

function toCsv(rows) {
  if (!rows.length) return ''
  const headers = Array.from(rows.reduce((acc, row) => {
    Object.keys(row || {}).forEach((key) => acc.add(key))
    return acc
  }, new Set()))

  const lines = [headers.join(',')]
  rows.forEach((row) => lines.push(headers.map((header) => escapeCsvCell(row?.[header])).join(',')))
  return lines.join('\n')
}

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
      continue
    }

    current += char
  }

  result.push(current)
  return result
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (!lines.length) return { headers: [], rows: [] }

  const headers = parseCsvLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce((acc, header, idx) => {
      acc[header] = values[idx] ?? ''
      return acc
    }, {})
  })

  return { headers, rows }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function toExcelTable(rows) {
  const headers = Array.from(rows.reduce((acc, row) => {
    Object.keys(row || {}).forEach((key) => acc.add(key))
    return acc
  }, new Set()))

  const headerHtml = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')
  const bodyHtml = rows.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row?.[h])}</td>`).join('')}</tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></body></html>`
}

function parseXlsLikeText(text) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')
  const table = doc.querySelector('table')

  if (table) {
    const rows = Array.from(table.querySelectorAll('tr'))
    const headers = Array.from(rows[0]?.querySelectorAll('th,td') || []).map((cell) => cell.textContent?.trim() || '')
    const dataRows = rows.slice(1).map((tr) => {
      const cells = Array.from(tr.querySelectorAll('td'))
      return headers.reduce((acc, header, idx) => {
        acc[header] = cells[idx]?.textContent?.trim() || ''
        return acc
      }, {})
    })
    return { headers, rows: dataRows.filter((row) => Object.values(row).some((v) => String(v).trim())) }
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (!lines.length) return { headers: [], rows: [] }

  const headers = lines[0].split('\t').map((v) => v.trim())
  const rows = lines.slice(1).map((line) => {
    const parts = line.split('\t')
    return headers.reduce((acc, header, idx) => {
      acc[header] = parts[idx]?.trim() || ''
      return acc
    }, {})
  })

  return { headers, rows }
}


function readUint16LE(view, offset) {
  return view.getUint16(offset, true)
}

function readUint32LE(view, offset) {
  return view.getUint32(offset, true)
}

function decodeText(bytes) {
  return new TextDecoder('utf-8').decode(bytes)
}

function concatUint8(chunks, total) {
  const out = new Uint8Array(total)
  let offset = 0
  chunks.forEach((chunk) => {
    out.set(chunk, offset)
    offset += chunk.length
  })
  return out
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Tu navegador no soporta descompresión para XLSX')
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  const reader = stream.getReader()
  const chunks = []
  let total = 0

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }

  return concatUint8(chunks, total)
}

async function unzipXlsx(arrayBuffer) {
  const view = new DataView(arrayBuffer)
  const bytes = new Uint8Array(arrayBuffer)

  let eocdOffset = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      eocdOffset = i
      break
    }
  }

  if (eocdOffset < 0) throw new Error('XLSX inválido (EOCD no encontrado)')

  const cdOffset = readUint32LE(view, eocdOffset + 16)
  const cdSize = readUint32LE(view, eocdOffset + 12)
  const entries = new Map()

  let ptr = cdOffset
  const cdEnd = cdOffset + cdSize

  while (ptr < cdEnd) {
    const sig = readUint32LE(view, ptr)
    if (sig !== 0x02014b50) break

    const compression = readUint16LE(view, ptr + 10)
    const compressedSize = readUint32LE(view, ptr + 20)
    const fileNameLength = readUint16LE(view, ptr + 28)
    const extraLength = readUint16LE(view, ptr + 30)
    const commentLength = readUint16LE(view, ptr + 32)
    const localHeaderOffset = readUint32LE(view, ptr + 42)

    const fileNameBytes = bytes.slice(ptr + 46, ptr + 46 + fileNameLength)
    const fileName = decodeText(fileNameBytes)

    const localSig = readUint32LE(view, localHeaderOffset)
    if (localSig !== 0x04034b50) throw new Error('XLSX inválido (local header)')

    const localNameLen = readUint16LE(view, localHeaderOffset + 26)
    const localExtraLen = readUint16LE(view, localHeaderOffset + 28)
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
    const compressed = bytes.slice(dataStart, dataStart + compressedSize)

    entries.set(fileName, { compression, compressed })

    ptr += 46 + fileNameLength + extraLength + commentLength
  }

  const files = new Map()
  for (const [name, entry] of entries.entries()) {
    let content
    if (entry.compression === 0) {
      content = entry.compressed
    } else if (entry.compression === 8) {
      content = await inflateRaw(entry.compressed)
    } else {
      continue
    }
    files.set(name, decodeText(content))
  }

  return files
}

function colLettersToIndex(letters) {
  let value = 0
  const upper = letters.toUpperCase()
  for (let i = 0; i < upper.length; i += 1) {
    value = value * 26 + (upper.charCodeAt(i) - 64)
  }
  return value - 1
}

function parseCellRef(ref) {
  const match = /^([A-Z]+)(\d+)$/.exec(ref || '')
  if (!match) return { col: -1, row: -1 }
  return { col: colLettersToIndex(match[1]), row: Number(match[2]) - 1 }
}

function parseSharedStrings(xml) {
  if (!xml) return []
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const items = Array.from(doc.getElementsByTagName('si'))
  return items.map((si) => {
    const textNodes = Array.from(si.getElementsByTagName('t'))
    return textNodes.map((n) => n.textContent || '').join('')
  })
}

function parseSheetRows(xml, sharedStrings) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const rowNodes = Array.from(doc.getElementsByTagName('row'))
  const matrix = []

  rowNodes.forEach((rowNode) => {
    const cells = Array.from(rowNode.getElementsByTagName('c'))
    const rowData = []

    cells.forEach((cell) => {
      const ref = cell.getAttribute('r') || ''
      const type = cell.getAttribute('t') || ''
      const { col } = parseCellRef(ref)
      if (col < 0) return

      let value = ''
      if (type === 'inlineStr') {
        value = Array.from(cell.getElementsByTagName('t')).map((n) => n.textContent || '').join('')
      } else if (type === 's') {
        const idx = Number(cell.getElementsByTagName('v')[0]?.textContent || '-1')
        value = sharedStrings[idx] ?? ''
      } else {
        value = cell.getElementsByTagName('v')[0]?.textContent || ''
      }

      rowData[col] = value
    })

    matrix.push(rowData)
  })

  return matrix
}

async function parseXlsx(file) {
  const files = await unzipXlsx(await file.arrayBuffer())
  const workbookXml = files.get('xl/workbook.xml')
  if (!workbookXml) throw new Error('XLSX inválido: falta workbook.xml')

  const workbookDoc = new DOMParser().parseFromString(workbookXml, 'application/xml')
  const firstSheet = workbookDoc.getElementsByTagName('sheet')[0]
  if (!firstSheet) throw new Error('XLSX sin hojas')

  const relId = firstSheet.getAttribute('r:id')
  const relsXml = files.get('xl/_rels/workbook.xml.rels')
  if (!relsXml) throw new Error('XLSX inválido: faltan relaciones')

  const relsDoc = new DOMParser().parseFromString(relsXml, 'application/xml')
  const relNodes = Array.from(relsDoc.getElementsByTagName('Relationship'))
  const rel = relNodes.find((n) => n.getAttribute('Id') === relId)
  if (!rel) throw new Error('No se encontró la hoja principal')

  const target = rel.getAttribute('Target') || ''
  const normalizedTarget = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`
  const sheetXml = files.get(normalizedTarget)
  if (!sheetXml) throw new Error('No se pudo leer la hoja XLSX')

  const sharedStrings = parseSharedStrings(files.get('xl/sharedStrings.xml'))
  const matrix = parseSheetRows(sheetXml, sharedStrings)
  if (!matrix.length) return { headers: [], rows: [] }

  const headers = (matrix[0] || []).map((v) => String(v || '').trim())
  const rows = matrix.slice(1).map((rowArr) => headers.reduce((acc, header, idx) => {
    if (!header) return acc
    acc[header] = rowArr[idx] ?? ''
    return acc
  }, {})).filter((row) => Object.values(row).some((v) => String(v).trim()))

  return { headers: headers.filter(Boolean), rows }
}

export default function DataTransferPage() {
  const [table, setTable] = useState(TABLE_OPTIONS[0].value)
  const [exportFormat, setExportFormat] = useState('csv')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')

  const [fieldOptions, setFieldOptions] = useState([])
  const [loadingFields, setLoadingFields] = useState(false)

  const [selectedFileName, setSelectedFileName] = useState('')
  const [parsedRows, setParsedRows] = useState([])
  const [sourceHeaders, setSourceHeaders] = useState([])
  const [mapping, setMapping] = useState({})
  const [matchField, setMatchField] = useState('')

  const tableConfig = useMemo(() => TABLE_OPTIONS.find((opt) => opt.value === table), [table])

  useEffect(() => {
    async function loadFields() {
      setLoadingFields(true)
      setFieldOptions([])
      setMatchField('')
      setSelectedFileName('')
      setMapping({})
      setParsedRows([])
      setSourceHeaders([])

      try {
        const options = await dataTransferApi.getFieldOptions(table)
        setFieldOptions(options)
        const suggested = tableConfig?.suggestedMatchFields?.find((field) => options.some((opt) => opt.value === field))
        setMatchField(suggested || options[0]?.value || '')
      } catch {
        setFieldOptions([])
      } finally {
        setLoadingFields(false)
      }
    }

    loadFields()
  }, [table, tableConfig])

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function handleExport() {
    setBusy(true)
    setMessage('')
    try {
      const rows = await dataTransferApi.exportRows(table)
      const safeName = table.replaceAll('/', '-')

      if (exportFormat === 'xls') {
        downloadFile(toExcelTable(rows), `${safeName}-export.xls`, 'application/vnd.ms-excel;charset=utf-8;')
      } else {
        downloadFile(toCsv(rows), `${safeName}-export.csv`, 'text/csv;charset=utf-8;')
      }

      setMessageType('success')
      setMessage(`Exportación completada en ${exportFormat.toUpperCase()}: ${rows.length} registro(s) de ${tableConfig?.label}.`)
    } catch {
      setMessageType('error')
      setMessage('No se pudo exportar la data. Verifica tu conexión o permisos.')
    } finally {
      setBusy(false)
    }
  }

  function applyAutoMapping(headers) {
    const fields = fieldOptions.map((opt) => opt.value)
    const nextMapping = {}

    headers.forEach((header) => {
      const normalizedHeader = header.trim().toLowerCase().replaceAll(' ', '_')
      const exact = fields.find((field) => field.toLowerCase() === normalizedHeader)
      const partial = fields.find((field) => normalizedHeader.includes(field.toLowerCase()))
      nextMapping[header] = exact || partial || ''
    })

    setMapping(nextMapping)
  }

  async function handleFileSelected(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setBusy(true)
    setMessage('')

    try {
      let parsed
      const lower = file.name.toLowerCase()

      if (lower.endsWith('.csv')) {
        parsed = parseCsv(await file.text())
      } else if (lower.endsWith('.xls')) {
        parsed = parseXlsLikeText(await file.text())
      } else if (lower.endsWith('.xlsx') || lower.endsWith('.xlsm')) {
        parsed = await parseXlsx(file)
      } else {
        throw new Error('Formato no soportado')
      }

      if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) throw new Error('Archivo sin data')

      setSelectedFileName(file.name)
      setParsedRows(parsed.rows)
      setSourceHeaders(parsed.headers)
      applyAutoMapping(parsed.headers)
      setMessageType('info')
      setMessage(`Archivo cargado: ${parsed.rows.length} fila(s). Continúa con el mapeo de columnas.`)
    } catch {
      setMessageType('error')
      setMessage('Archivo inválido. Verifica que tu CSV/XLS/XLSX tenga encabezados en la primera fila y datos válidos.')
      setSelectedFileName('')
      setParsedRows([])
      setSourceHeaders([])
      setMapping({})
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  function buildMappedRows() {
    return parsedRows
      .map((row) => {
        const mapped = {}
        sourceHeaders.forEach((header) => {
          const targetField = mapping[header]
          if (!targetField) return
          mapped[targetField] = row[header]
        })
        return mapped
      })
      .filter((row) => Object.keys(row).length > 0)
  }

  async function handleImport() {
    if (!parsedRows.length) return
    if (!matchField) {
      setMessageType('warning')
      setMessage('Selecciona un campo de comparación para actualizar duplicados.')
      return
    }

    const mappedRows = buildMappedRows()
    if (!mappedRows.length) {
      setMessageType('warning')
      setMessage('Mapea al menos una columna a un campo destino antes de importar.')
      return
    }

    setBusy(true)
    setMessage('')

    try {
      const result = await dataTransferApi.upsertRows({ endpoint: table, rows: mappedRows, matchField })
      setMessageType(result.failed === 0 ? 'success' : 'warning')

      let detail = ''
      if (result.failed > 0 && result.errors?.length) {
        const first = result.errors[0]
        const firstDetail = typeof first.detail === 'string' ? first.detail : JSON.stringify(first.detail)
        detail = ` Primer error (${first.key}): ${firstDetail}`
      }

      setMessage(`Carga finalizada: ${result.updated} actualizado(s), ${result.created} creado(s), ${result.failed} con error y ${result.skippedWithoutKey} omitido(s) por faltar ${matchField}.${detail}`)
    } catch (error) {
      setMessageType('error')
      const backendDetail = error?.response?.data ? JSON.stringify(error.response.data) : (error?.message || 'Error desconocido')
      setMessage(`No se pudo cargar el archivo. Detalle: ${backendDetail}`)
    } finally {
      setBusy(false)
    }
  }

  const mappedReadyCount = buildMappedRows().length

  return (
    <PageShell
      title="Importar / Exportar"
      subtitle="Flujo de importación: tabla → archivo → mapeo → cargar y actualizar"
    >
      <div className={styles.layout}>
        <section className={styles.card}>
          <h3 className={styles.title}>Importación guiada</h3>

          <div className={styles.step}>
            <span className={styles.stepBadge}>1</span>
            <div>
              <p className={styles.stepTitle}>Seleccionar tabla destino</p>
              <Select
                label="Tabla"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                options={TABLE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                disabled={busy}
              />
            </div>
          </div>

          <div className={styles.step}>
            <span className={styles.stepBadge}>2</span>
            <div>
              <p className={styles.stepTitle}>Seleccionar archivo CSV o Excel</p>
              <label className={styles.uploadBtn}>
                Elegir archivo (.csv / .xls / .xlsx)
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx,.xlsm,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  onChange={handleFileSelected}
                  disabled={busy || loadingFields}
                  hidden
                />
              </label>
              {selectedFileName && <p className={styles.helper}>Archivo: {selectedFileName}</p>}
            </div>
          </div>

          <div className={styles.step}>
            <span className={styles.stepBadge}>3</span>
            <div>
              <p className={styles.stepTitle}>Mapear columnas y llave de actualización</p>
              <Select
                label="Campo para detectar repetidos (se actualiza si existe)"
                value={matchField}
                onChange={(e) => setMatchField(e.target.value)}
                options={fieldOptions}
                disabled={busy || loadingFields || !parsedRows.length}
              />

              {sourceHeaders.length > 0 && (
                <div className={styles.mappingCard}>
                  <h4 className={styles.mappingTitle}>Mapeo de columnas</h4>
                  <div className={styles.mappingGrid}>
                    {sourceHeaders.map((header) => (
                      <div className={styles.mappingRow} key={header}>
                        <span className={styles.sourceCol}>{header}</span>
                        <select
                          className={styles.select}
                          value={mapping[header] || ''}
                          onChange={(e) => setMapping((prev) => ({ ...prev, [header]: e.target.value }))}
                          disabled={busy}
                        >
                          <option value="">No importar</option>
                          {fieldOptions.map((field) => (
                            <option key={field.value} value={field.value}>{field.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.step}>
            <span className={styles.stepBadge}>4</span>
            <div className={styles.actions}>
              <Button onClick={handleImport} loading={busy} disabled={!parsedRows.length || !mappedReadyCount}>Cargar y actualizar datos</Button>
              <span className={styles.helper}>{parsedRows.length || 0} filas leídas · {mappedReadyCount} filas listas para carga</span>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h3 className={styles.title}>Exportación rápida</h3>
          <p className={styles.description}>Opcional: descarga respaldo de la tabla seleccionada en CSV o Excel.</p>
          <div className={styles.row}>
            <Select
              label="Formato"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              options={EXPORT_FORMATS}
              disabled={busy}
            />
            <div className={styles.actions}><Button onClick={handleExport} loading={busy}>Exportar</Button></div>
          </div>
        </section>

        {message && <p className={[styles.message, styles[messageType]].join(' ')}>{message}</p>}
      </div>
    </PageShell>
  )
}