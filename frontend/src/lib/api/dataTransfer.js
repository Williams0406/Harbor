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
      'boost_pressure', 'engine_oil_level', 'refill_engine_oil',
    ],
  },
]

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

function cleanRecord(row) {
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
    if (key.endsWith('_name')) delete clone[key]
  })

  return clone
}

function buildKeyValue(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim().toLowerCase()
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
      const key = buildKeyValue(row?.[matchField])
      if (key) existingMap.set(key, row)
    })

    const deduped = new Map()
    rows.forEach((row) => {
      const key = buildKeyValue(row?.[matchField])
      if (!key) return
      deduped.set(key, row)
    })

    let created = 0
    let updated = 0
    let failed = 0
    const errors = []

    for (const [key, row] of deduped.entries()) {
      const payload = cleanRecord(row)
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