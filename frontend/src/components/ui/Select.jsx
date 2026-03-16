'use client'
import styles from './Select.module.css'

export default function Select({ label, id, options = [], error, ...props }) {
  return (
    <div className={styles.wrapper}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <select id={id} className={[styles.select, error ? styles.error : ''].join(' ')} {...props}>
        <option value="">— Seleccionar —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  )
}