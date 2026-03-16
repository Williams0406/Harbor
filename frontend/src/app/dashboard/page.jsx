'use client'

import { useEffect, useState } from 'react'
import { getUser } from '@/lib/auth'
import { bankApi }      from '@/lib/api/bank'
import { contactsApi }  from '@/lib/api/contacts'
import { purchasesApi } from '@/lib/api/purchases'
import { salesApi }     from '@/lib/api/sales'
import { inventoryApi } from '@/lib/api/inventory'
import { paymentsApi }  from '@/lib/api/payments'
import Header from '@/components/layout/Header'
import styles from './dashboard.module.css'

const STATS = [
  { key: 'contacts',  label: 'Contactos',  icon: '◎', color: '#58a6ff' },
  { key: 'purchases', label: 'Compras',    icon: '↓',  color: '#3fb950' },
  { key: 'sales',     label: 'Ventas',     icon: '↑',  color: '#d29922' },
  { key: 'inventory', label: 'Inventario', icon: '▦',  color: '#bc8cff' },
  { key: 'payments',  label: 'Pagos',      icon: '⬡',  color: '#f78166' },
  { key: 'accounts',  label: 'Cuentas',    icon: '⬡',  color: '#2f81f7' },
]

export default function DashboardPage() {
  const user = getUser()
  const [counts, setCounts]   = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [contacts, purchases, sales, inventory, payments, accounts] =
          await Promise.allSettled([
            contactsApi.getContacts(),
            purchasesApi.getPurchases(),
            salesApi.getSales(),
            inventoryApi.getEntries(),
            paymentsApi.getPayments(),
            bankApi.getAccounts(),
          ])

        setCounts({
          contacts:  contacts.value?.data?.count  ?? contacts.value?.data?.length  ?? '—',
          purchases: purchases.value?.data?.count ?? purchases.value?.data?.length ?? '—',
          sales:     sales.value?.data?.count     ?? sales.value?.data?.length     ?? '—',
          inventory: inventory.value?.data?.count ?? inventory.value?.data?.length ?? '—',
          payments:  payments.value?.data?.count  ?? payments.value?.data?.length  ?? '—',
          accounts:  accounts.value?.data?.count  ?? accounts.value?.data?.length  ?? '—',
        })
      } catch {
        // Silenciar errores de carga del dashboard
      } finally {
        setLoading(false)
      }
    }
    fetchCounts()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className={styles.page}>
      <Header
        title="Dashboard"
        subtitle={`${greeting}, ${user?.first_name || user?.username || 'Usuario'}`}
      />

      <div className={styles.content}>
        {/* Tarjetas de estadísticas */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Resumen del sistema</h2>
          <div className={styles.statsGrid}>
            {STATS.map((stat, i) => (
              <div
                key={stat.key}
                className={styles.statCard}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={styles.statIcon} style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statCount}>
                    {loading ? (
                      <span className={styles.skeleton} />
                    ) : (
                      counts[stat.key] ?? '0'
                    )}
                  </span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accesos rápidos */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Accesos rápidos</h2>
          <div className={styles.quickGrid}>
            {[
              { label: 'Nueva compra',   href: '/dashboard/purchases',  desc: 'Registrar comprobante de compra' },
              { label: 'Nueva venta',    href: '/dashboard/sales',      desc: 'Registrar comprobante de venta' },
              { label: 'Nuevo pago',     href: '/dashboard/payments',   desc: 'Registrar egreso o ingreso' },
              { label: 'Nuevo reporte',  href: '/dashboard/reports',    desc: 'Cargar reporte de motor' },
            ].map((q) => (
              <a key={q.href} href={q.href} className={styles.quickCard}>
                <span className={styles.quickLabel}>{q.label}</span>
                <span className={styles.quickDesc}>{q.desc}</span>
                <span className={styles.quickArrow}>→</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}