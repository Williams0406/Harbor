import styles from './Badge.module.css'

const VARIANTS = {
  pending:    'warning',
  in_process: 'info',
  cancelled:  'danger',
  buyer:      'info',
  seller:     'success',
  product:    'success',
  service:    'purple',
  expense:    'danger',
  income:     'success',
  admin:      'info',
  operator:   'warning',
  viewer:     'default',
}

export default function Badge({ label, variant }) {
  const v = variant || VARIANTS[label?.toLowerCase?.()] || 'default'
  return <span className={[styles.badge, styles[v]].join(' ')}>{label}</span>
}