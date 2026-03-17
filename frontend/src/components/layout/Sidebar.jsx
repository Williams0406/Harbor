'use client'

import { usePathname, useRouter } from 'next/navigation'
import { logoutUser } from '@/lib/auth'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/dashboard',       icon: '◈' },
  { label: 'Banco',         href: '/dashboard/bank',          icon: '⬡' },
  { label: 'Contactos',     href: '/dashboard/contacts',      icon: '◎' },
  { label: 'Ítems',         href: '/dashboard/items',         icon: '⬢' },
  { label: 'Compras',       href: '/dashboard/purchases',     icon: '↓' },
  { label: 'Inventario',    href: '/dashboard/inventory',     icon: '▦' },
  { label: 'Ventas',        href: '/dashboard/sales',         icon: '↑' },
  { label: 'Pagos',         href: '/dashboard/payments',      icon: '⬡' },
  { label: 'T. Cambio',     href: '/dashboard/exchange-rates',icon: '⟳' },
  { label: 'Reportes',      href: '/dashboard/report',       icon: '▤' },
  { label: 'Importar/Exportar', href: '/dashboard/data-transfer', icon: '⇅' },
  { label: 'Personas/Tokens', href: '/dashboard/registration-tokens', icon: '🔐' },
]

export default function Sidebar({ user }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await logoutUser()
    router.push('/login')
  }

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⬡</span>
        <div>
          <span className={styles.logoName}>Harbor</span>
          <span className={styles.logoSub}>Supplies ERP</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <a
              key={item.href}
              href={item.href}
              className={[styles.navItem, active ? styles.navActive : ''].join(' ')}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {active && <span className={styles.navIndicator} />}
            </a>
          )
        })}
      </nav>

      {/* Usuario */}
      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{user?.username || 'Usuario'}</span>
            <span className={styles.userRole}>{user?.role || ''}</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
          <span className={styles.navIcon}>⏻</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}