'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getUser } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import styles from './layout.module.css'

export default function DashboardLayout({ children }) {
  const router  = useRouter()
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    setUser(getUser())
    setChecking(false)
  }, [router])

  if (checking) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    )
  }

  return (
    <div
      className={styles.shell}
      style={{ '--sidebar-current-width': sidebarCollapsed ? '88px' : '280px' }}
    >
      <Sidebar user={user} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(value => !value)} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}