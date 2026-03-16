import Header from '@/components/layout/Header'
import styles from './PageShell.module.css'

export default function PageShell({ title, subtitle, actions, children }) {
  return (
    <div className={styles.page}>
      <Header title={title} subtitle={subtitle} actions={actions} />
      <div className={styles.content}>{children}</div>
    </div>
  )
}