'use client'

import styles from './Input.module.css'

export default function Input({
  label,
  error,
  id,
  type = 'text',
  ...props
}) {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={[styles.input, error ? styles.inputError : ''].join(' ')}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}