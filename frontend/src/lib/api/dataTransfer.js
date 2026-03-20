import api from '../axios'

export const TABLE_OPTIONS = [
  {
    value: 'bank/accounts',
    label: 'Cuentas bancarias',
    suggestedMatchFields: ['account_number', 'cci', 'bank_name'],
    importFields: ['bank_name', 'account_number', 'cci'],
  },
  {
    value: 'bank/movements',
    label: 'Movimientos bancarios',
    suggestedMatchFields: ['movement_number', 'reference'],
    importFields: ['account', 'operation_date', 'value_date', 'reference', 'amount', 'itf', 'movement_number'],
  },
  {
    value: 'contacts',
    label: 'Contactos',
    suggestedMatchFields: ['ruc_dni', 'email', 'name'],
    importFields: ['category', 'name', 'phone', 'email', 'ruc_dni', 'business_name', 'reference'],
  },
  {
    value: 'items',
    label: 'Ítems',
    suggestedMatchFields: ['code', 'description'],
    importFields: ['category', 'code', 'description'],
  },
  {
    value: 'purchases',
    label: 'Compras',
    suggestedMatchFields: ['voucher_number', 'id'],
    importFields: ['voucher_type', 'voucher_number', 'status', 'contact', 'voucher_pdf'],
  },
  {
    value: 'inventory',
    label: 'Inventario',
    suggestedMatchFields: ['item', 'date'],
    importFields: ['item', 'quantity'],
  },
  {
    value: 'sales',
    label: 'Ventas',
    suggestedMatchFields: ['voucher_number', 'id'],
    importFields: ['voucher_type', 'voucher_number', 'status', 'contact'],
  },
  {
    value: 'payments',
    label: 'Pagos',
    suggestedMatchFields: ['detail', 'id'],
    importFields: ['detail', 'category', 'voucher_type', 'amount', 'contact'],
  },
  {
    value: 'exchange-rates',
    label: 'Tipo de cambio',
    suggestedMatchFields: ['date'],
    importFields: ['date', 'buy_dollar', 'sell_dollar', 'buy_euro', 'sell_euro'],
  },
  {
    value: 'reports',
    label: 'Reportes',
    suggestedMatchFields: ['date', 'hourmeter'],
    importFields: [
      'date', 'hourmeter', 'rpm_speed', 'knot_speed', 'fish_in_hold',
      'ambient_temp_engine_room', 'intake_air_temp', 'exhaust_pipe_temp',
      'oil_pressure', 'oil_temp_crankcase', 'engine_coolant_temp', 'damper_temp',
      'boost_pressure', 'engine_oil_level', 'refill_engine_oil', 'coolant_pump_pressure',
      'aftercooler_coolant_inlet_temp', 'aftercooler_coolant_outlet_temp',
      'liner_coolant_inlet_temp', 'liner_coolant_outlet_temp',
      'gearbox_coolant_inlet_temp', 'gearbox_coolant_outlet_temp',
      'exhaust_temp_cyl_1', 'exhaust_temp_cyl_2', 'exhaust_temp_cyl_3',
      'exhaust_temp_cyl_4', 'exhaust_temp_cyl_5', 'exhaust_temp_cyl_6',
      'gearbox_oil_pressure', 'gearbox_oil_temp',
    ],
  },
]


const DECIMAL_FIELD_LIMITS = {
  reports: {
    hourmeter:                       { maxDigits: 10, decimalPlaces: 1 },
    rpm_speed:                       { maxDigits: 8,  decimalPlaces: 1 },
    knot_speed:                      { maxDigits: 8,  decimalPlaces: 2 },
    fish_in_hold:                    { maxDigits: 10, decimalPlaces: 2 },
    ambient_temp_engine_room:        { maxDigits: 6,  decimalPlaces: 2 },
    intake_air_temp:                 { maxDigits: 6,  decimalPlaces: 2 },
    exhaust_pipe_temp:               { maxDigits: 6,  decimalPlaces: 2 },
    oil_pressure:                    { maxDigits: 6,  decimalPlaces: 2 },
    oil_temp_crankcase:              { maxDigits: 6,  decimalPlaces: 2 },
    engine_coolant_temp:             { maxDigits: 6,  decimalPlaces: 2 },
    damper_temp:                     { maxDigits: 6,  decimalPlaces: 2 },
    boost_pressure:                  { maxDigits: 6,  decimalPlaces: 2 },
    engine_oil_level:                { maxDigits: 6,  decimalPlaces: 2 },
    refill_engine_oil:               { maxDigits: 3,  decimalPlaces: 1 },
    coolant_pump_pressure:           { maxDigits: 6,  decimalPlaces: 2 },
    aftercooler_coolant_inlet_temp:  { maxDigits: 6,  decimalPlaces: 2 },
    aftercooler_coolant_outlet_temp: { maxDigits: 6,  decimalPlaces: 2 },
    liner_coolant_inlet_temp:        { maxDigits: 6,  decimalPlaces: 2 },
    liner_coolant_outlet_temp:       { maxDigits: 6,  decimalPlaces: 2 },
    gearbox_coolant_inlet_temp:      { maxDigits: 6,  decimalPlaces: 2 },
    gearbox_coolant_outlet_temp:     { maxDigits: 6,  decimalPlaces: 2 },
    exhaust_temp_cyl_1:              { maxDigits: 6,  decimalPlaces: 2 },
    exhaust_temp_cyl_2:              { maxDigits: 6,  decimalPlaces: 2 },
    exhaust_temp_cyl_3:              { maxDigits: 6,  decimalPlaces: 2 },
    exhaust_temp_cyl_4:              { maxDigits: 6,  decimalPlaces: 2 },
    exhaust_temp_cyl_5:              { maxDigits: 6,  decimalPlaces: 2 },
    exhaust_temp_cyl_6:              { maxDigits: 6,  decimalPlaces: 2 },
    gearbox_oil_pressure:            { maxDigits: 6,  decimalPlaces: 2 },
    gearbox_oil_temp:                { maxDigits: 6,  decimalPlaces: 2 },
  },
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function normalizeEndpointUrl(endpoint, nextUrl) {
  if (!nextUrl) return null
  if (nextUrl.startsWith('http')) {
    try {
      const parsed = new URL(nextUrl)
      const path = parsed.pathname
      const query = parsed.search
      if (path.includes('/api/')) {
        return `${path.slice(path.indexOf('/api/') + 4)}${query}`
      }
      return `${path}${query}`
    } catch {
      return nextUrl
    }
  }

  if (nextUrl.startsWith('/api/')) return nextUrl.slice(4)
  if (nextUrl.startsWith('/')) return nextUrl
  return `/${endpoint}/?${nextUrl}`
}

function padDatePart(value) {
  return String(value).padStart(2, '0')
}

function formatIsoDate(year, month, day) {
  const normalizedYear = Number(year)
  const normalizedMonth = Number(month)
  const normalizedDay = Number(day)

  if (
    !Number.isInteger(normalizedYear) ||
    !Number.isInteger(normalizedMonth) ||
    !Number.isInteger(normalizedDay) ||
    normalizedMonth < 1 || normalizedMonth > 12 ||
    normalizedDay < 1 || normalizedDay > 31
  ) {
    return null
  }

  const date = new Date(Date.UTC(normalizedYear, normalizedMonth - 1, normalizedDay))
  if (
    date.getUTCFullYear() !== normalizedYear ||
    date.getUTCMonth() !== normalizedMonth - 1 ||
    date.getUTCDate() !== normalizedDay
  ) {
    return null
  }

  return `${normalizedYear}-${padDatePart(normalizedMonth)}-${padDatePart(normalizedDay)}`
}

function excelSerialToIsoDate(value) {
  const serial = Number(value)
  if (!Number.isFinite(serial)) return null

  const wholeDays = Math.floor(serial)
  if (wholeDays <= 0) return null

  const excelEpoch = Date.UTC(1899, 11, 30)
  const utcDate = new Date(excelEpoch + wholeDays * 86400000)
  return formatIsoDate(utcDate.getUTCFullYear(), utcDate.getUTCMonth() + 1, utcDate.getUTCDate())
}

function normalizeDateValue(value) {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

    const localeMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)
    if (localeMatch) {
      const [, day, month, year] = localeMatch
      return formatIsoDate(year, month, day) || trimmed
    }

    if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
      return excelSerialToIsoDate(trimmed) || trimmed
    }

    return trimmed
  }

  if (typeof value === 'number') {
    return excelSerialToIsoDate(value) || value
  }

  return value
}

function normalizeDecimalSeparator(value) {
  const trimmed = String(value).trim().replace(/\s+/g, '')
  if (!trimmed) return ''

  const hasComma = trimmed.includes(',')
  const hasDot = trimmed.includes('.')

  if (hasComma && hasDot) {
    const lastComma = trimmed.lastIndexOf(',')
    const lastDot = trimmed.lastIndexOf('.')
    const decimalSeparator = lastComma > lastDot ? ',' : '.'
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ','
    return trimmed.split(thousandsSeparator).join('').replace(decimalSeparator, '.')
  }

  if (hasComma) return trimmed.replace(',', '.')
  return trimmed
}

function normalizeDecimalValue(value, limits) {
  if (value === null || value === undefined) return value

  const normalizedInput = normalizeDecimalSeparator(value)
  if (!normalizedInput) return ''

  const numericValue = Number(normalizedInput)
  if (!Number.isFinite(numericValue)) return typeof value === 'string' ? value.trim() : value

  const rounded = limits.decimalPlaces > 0
    ? numericValue.toFixed(limits.decimalPlaces)
    : String(Math.round(numericValue))

  const unsigned = rounded.startsWith('-') ? rounded.slice(1) : rounded
  const digitsCount = unsigned.replace('.', '').length
  if (digitsCount > limits.maxDigits) return rounded

  return rounded
}

function normalizeFieldValue(field, value, endpoint = '') {
  if (value === null || value === undefined) return value
  if (field === 'date' || field.endsWith('_date')) {
    return normalizeDateValue(value)
  }

  const decimalLimits = DECIMAL_FIELD_LIMITS[endpoint]?.[field]
  if (decimalLimits) {
    return normalizeDecimalValue(value, decimalLimits)
  }

  return value
}

function cleanRecord(row, endpoint = '') {
  if (!row || typeof row !== 'object') return row

  const clone = { ...row }
  delete clone.id
  delete clone.created_at
  delete clone.updated_at
  delete clone.createdAt
  delete clone.updatedAt
  delete clone.account_name
  delete clone.item_code
  delete clone.item_description
  delete clone.contact_name
  delete clone.details
  delete clone.items
  delete clone.reports

  Object.keys(clone).forEach((key) => {
    if (key.endsWith('_name')) {
      delete clone[key]
      return
    }

    clone[key] = normalizeFieldValue(key, clone[key], endpoint)
  })

  return clone
}

function buildKeyValue(value, field, endpoint = '') {
  if (value === null || value === undefined) return ''
  return String(normalizeFieldValue(field || '', value, endpoint)).trim().toLowerCase()
}

export const dataTransferApi = {
  getTableConfig: (endpoint) => TABLE_OPTIONS.find((t) => t.value === endpoint),

  exportRows: async (endpoint) => {
    let nextUrl = `/${endpoint}/`
    const rows = []

    while (nextUrl) {
      const res = await api.get(nextUrl)
      rows.push(...normalizeRows(res.data))
      nextUrl = normalizeEndpointUrl(endpoint, res.data?.next)
    }

    return rows
  },

  getFieldOptions: async (endpoint) => {
    let sampleRows = []
    try {
      sampleRows = await dataTransferApi.exportRows(endpoint)
    } catch {
      sampleRows = []
    }

    const fieldSet = new Set()

    sampleRows.slice(0, 100).forEach((row) => {
      Object.keys(row || {}).forEach((key) => {
        if (['id', 'created_at', 'updated_at'].includes(key)) return
        if (key.endsWith('_name')) return
        fieldSet.add(key)
      })
    })

    const tableConfig = dataTransferApi.getTableConfig(endpoint)
    ;(tableConfig?.importFields || []).forEach((field) => fieldSet.add(field))
    ;(tableConfig?.suggestedMatchFields || []).forEach((field) => fieldSet.add(field))

    return Array.from(fieldSet)
      .sort((a, b) => a.localeCompare(b))
      .map((field) => ({ value: field, label: field }))
  },

  upsertRows: async ({ endpoint, rows, matchField }) => {
    let existingRows = []
    try {
      existingRows = await dataTransferApi.exportRows(endpoint)
    } catch {
      existingRows = []
    }

    const existingMap = new Map()

    existingRows.forEach((row) => {
      const key = buildKeyValue(row?.[matchField], matchField, endpoint)
      if (key) existingMap.set(key, row)
    })

    const deduped = new Map()
    rows.forEach((row) => {
      const key = buildKeyValue(row?.[matchField], matchField, endpoint)
      if (!key) return
      deduped.set(key, row)
    })

    let created = 0
    let updated = 0
    let failed = 0
    const errors = []

    for (const [key, row] of deduped.entries()) {
      const payload = cleanRecord(row, endpoint)
      const current = existingMap.get(key)

      try {
        if (current?.id) {
          await api.patch(`/${endpoint}/${current.id}/`, payload)
          updated += 1
        } else {
          const createdRow = await api.post(`/${endpoint}/`, payload)
          created += 1
          if (createdRow?.data) {
            existingMap.set(key, createdRow.data)
          }
        }
      } catch (error) {
        failed += 1
        errors.push({
          key,
          detail: error.response?.data || error.message || 'Error desconocido',
        })
      }
    }

    return {
      created,
      updated,
      failed,
      totalProcessed: deduped.size,
      skippedWithoutKey: rows.length - deduped.size,
      errors,
    }
  },
}