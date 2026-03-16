'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getUser } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import styles from './layout.module.css'

export default function DashboardLayout({ children }) {
  const router  = useRouter()
  const [user, setUser]       = useState(null)
  const [checking, setChecking] = useState(true)

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
    <div className={styles.shell}>
      <Sidebar user={user} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}