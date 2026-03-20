'use client'

import { usePathname, useRouter } from 'next/navigation'
import { logoutUser } from '@/lib/auth'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Banco', href: '/dashboard/bank', icon: 'bank' },
  { label: 'Contactos', href: '/dashboard/contacts', icon: 'contacts' },
  { label: 'Ítems', href: '/dashboard/items', icon: 'items' },
  { label: 'Compras', href: '/dashboard/purchases', icon: 'purchases' },
  { label: 'Inventario', href: '/dashboard/inventory', icon: 'inventory' },
  { label: 'Ventas', href: '/dashboard/sales', icon: 'sales' },
  { label: 'Pagos', href: '/dashboard/payments', icon: 'payments' },
  { label: 'T. Cambio', href: '/dashboard/exchange-rates', icon: 'exchange' },
  { label: 'Reportes', href: '/dashboard/report', icon: 'reports' },
  { label: 'Importar/Exportar', href: '/dashboard/data-transfer', icon: 'transfer' },
  { label: 'Personas/Tokens', href: '/dashboard/registration-tokens', icon: 'security' },
]

function AppIcon({ name, className }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': 'true',
  }

  switch (name) {
    case 'dashboard':
      return <svg {...common}><path d="M4 5h7v6H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 13h7v6H4z" /></svg>
    case 'bank':
      return <svg {...common}><path d="M3 9 12 4l9 5" /><path d="M5 10v8M9 10v8M15 10v8M19 10v8M4 20h16" /></svg>
    case 'contacts':
      return <svg {...common}><path d="M16 19a4 4 0 0 0-8 0" /><circle cx="12" cy="10" r="3.5" /><path d="M5 19a3 3 0 0 1 3-3" /><path d="M19 19a3 3 0 0 0-3-3" /></svg>
    case 'items':
      return <svg {...common}><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="M4 7l8 4 8-4" /><path d="M12 11v10" /></svg>
    case 'purchases':
      return <svg {...common}><path d="M7 4h10l2 4H5l2-4Z" /><path d="M6 8v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" /><path d="m12 11 0 5" /><path d="m9.5 13.5 2.5 2.5 2.5-2.5" /></svg>
    case 'inventory':
      return <svg {...common}><path d="M4 5h7v6H4zM13 5h7v6h-7zM4 13h7v6H4zM13 13h7v6h-7z" /></svg>
    case 'sales':
      return <svg {...common}><path d="M7 20h10" /><path d="M12 4v12" /><path d="m7.5 9.5 4.5-4.5 4.5 4.5" /></svg>
    case 'payments':
      return <svg {...common}><rect x="4" y="6" width="16" height="12" rx="3" /><path d="M4 10h16" /><path d="M8 14h3" /></svg>
    case 'exchange':
      return <svg {...common}><path d="M4 7h12" /><path d="m13 4 3 3-3 3" /><path d="M20 17H8" /><path d="m11 14-3 3 3 3" /></svg>
    case 'reports':
      return <svg {...common}><path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>
    case 'transfer':
      return <svg {...common}><path d="M7 7h10" /><path d="m13 3 4 4-4 4" /><path d="M17 17H7" /><path d="m11 21-4-4 4-4" /></svg>
    case 'security':
      return <svg {...common}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="M10 12a2 2 0 1 1 4 0v2h-4Z" /><path d="M12 10v4" /></svg>
    case 'collapse':
      return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>
    case 'expand':
      return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>
    case 'logout':
      return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>
  }
}

export default function Sidebar({ user, collapsed, onToggle }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await logoutUser()
    router.push('/login')
  }

  return (
    <aside className={[styles.sidebar, collapsed ? styles.collapsed : ''].join(' ')}>
      <div className={styles.topRail}>
        <div className={styles.logoBlock}>
          <div className={styles.logoMarkWrap}>
            <span className={styles.logoMark}>H</span>
          </div>
          {!collapsed && (
            <div>
              <span className={styles.logoName}>Harbor</span>
              <span className={styles.logoSub}>Supplies ERP</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
          title={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          <AppIcon name={collapsed ? 'expand' : 'collapse'} className={styles.collapseIcon} />
        </button>
      </div>

      <div className={styles.sectionLabel}>{collapsed ? '•' : 'Navegación'}</div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <a
              key={item.href}
              href={item.href}
              className={[styles.navItem, active ? styles.navActive : ''].join(' ')}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIconWrap}>
                <AppIcon name={item.icon} className={styles.navIcon} />
              </span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              {!collapsed && active && <span className={styles.navBadge}>Actual</span>}
              {active && <span className={styles.navIndicator} />}
            </a>
          )
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userCard} title={collapsed ? (user?.username || 'Usuario') : undefined}>
          <div className={styles.userAvatar}>{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          {!collapsed && (
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.username || 'Usuario'}</span>
              <span className={styles.userRole}>{user?.role || 'Miembro del sistema'}</span>
            </div>
          )}
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
          <AppIcon name="logout" className={styles.logoutIcon} />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  )
}