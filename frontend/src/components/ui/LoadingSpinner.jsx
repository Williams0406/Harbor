import styles from './LoadingSpinner.module.css'

export default function LoadingSpinner({ size = 'md', text }) {
  return (
    <div className={styles.wrapper}>
      <div className={[styles.spinner, styles[size]].join(' ')} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  )
}